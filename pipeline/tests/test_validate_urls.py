"""Tests for URL validation helpers."""

import httpx
import pytest

from pipeline.validate.urls import normalize_url, validate_program_url


class _FakeURLClient:
    def __init__(self, *, head_response=None, get_response=None, exc=None):
        self.head_response = head_response
        self.get_response = get_response
        self.exc = exc
        self.calls: list[str] = []

    async def head(self, url: str):
        self.calls.append(f"HEAD {url}")
        if self.exc:
            raise self.exc
        return self.head_response

    async def get(self, url: str):
        self.calls.append(f"GET {url}")
        if self.exc:
            raise self.exc
        return self.get_response


def _response(status_code: int, url: str, *, history=None):
    return httpx.Response(
        status_code,
        request=httpx.Request("GET", url),
        history=history or [],
    )


def test_normalize_url_adds_https_scheme():
    assert normalize_url("example.com") == "https://example.com"
    assert normalize_url("http://example.com") == "http://example.com"


@pytest.mark.asyncio
async def test_validate_program_url_classifies_valid_url():
    client = _FakeURLClient(head_response=_response(200, "https://example.com"))

    result = await validate_program_url(
        {"id": "p1", "name": "Test", "website": "example.com"},
        client,  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "valid"
    assert result.status_code == 200
    assert client.calls == ["HEAD https://example.com"]


@pytest.mark.asyncio
async def test_validate_program_url_classifies_redirect():
    history = [_response(301, "https://example.com")]
    client = _FakeURLClient(
        head_response=_response(200, "https://www.example.com", history=history)
    )

    result = await validate_program_url(
        {"id": "p1", "name": "Test", "website": "https://example.com"},
        client,  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "redirect"
    assert result.final_url == "https://www.example.com"


@pytest.mark.asyncio
async def test_validate_program_url_falls_back_to_get_for_head_rejection():
    client = _FakeURLClient(
        head_response=_response(405, "https://example.com"),
        get_response=_response(200, "https://example.com"),
    )

    result = await validate_program_url(
        {"id": "p1", "name": "Test", "website": "https://example.com"},
        client,  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "valid"
    assert client.calls == ["HEAD https://example.com", "GET https://example.com"]


@pytest.mark.asyncio
async def test_validate_program_url_classifies_broken_status():
    client = _FakeURLClient(head_response=_response(404, "https://example.com"))

    result = await validate_program_url(
        {"id": "p1", "name": "Test", "website": "https://example.com"},
        client,  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert result.status == "broken"
    assert result.error == "HTTP 404"


@pytest.mark.asyncio
async def test_validate_program_url_classifies_timeout_and_dns_failure():
    timeout_result = await validate_program_url(
        {"id": "p1", "name": "Test", "website": "https://example.com"},
        _FakeURLClient(exc=httpx.TimeoutException("slow")),  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )
    dns_result = await validate_program_url(
        {"id": "p2", "name": "Test", "website": "https://missing.invalid"},
        _FakeURLClient(exc=httpx.ConnectError("dns")),  # type: ignore[arg-type]
        checked_at="2026-04-28T00:00:00+00:00",
    )

    assert timeout_result.status == "timeout"
    assert dns_result.status == "dns_failure"

