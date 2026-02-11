"""Web scraper — fetches program website content as plain text.

Handles timeouts, redirects, and non-HTML gracefully.
"""

from __future__ import annotations

import re
from html.parser import HTMLParser

import requests
from rich.console import Console

console = Console()

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; SFSchoolNavigator/1.0; "
        "+https://github.com/sf-school-navigator)"
    ),
    "Accept": "text/html,application/xhtml+xml",
}

# Tags whose text content we want to capture
_TEXT_TAGS = {
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "li", "td", "th", "span", "a", "strong", "em",
    "div", "section", "article", "blockquote", "dd", "dt",
    "label", "figcaption", "summary",
}

# Tags whose content should be ignored
_SKIP_TAGS = {"script", "style", "noscript", "svg", "nav", "footer", "header"}


class _TextExtractor(HTMLParser):
    """Simple HTML-to-text extractor."""

    def __init__(self) -> None:
        super().__init__()
        self._chunks: list[str] = []
        self._skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in _SKIP_TAGS:
            self._skip_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if tag in _SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1

    def handle_data(self, data: str) -> None:
        if self._skip_depth == 0:
            text = data.strip()
            if text:
                self._chunks.append(text)

    def get_text(self) -> str:
        raw = " ".join(self._chunks)
        # Collapse whitespace
        return re.sub(r"\s+", " ", raw).strip()


def html_to_text(html: str) -> str:
    """Convert HTML to clean text."""
    parser = _TextExtractor()
    parser.feed(html)
    return parser.get_text()


def fetch_page_text(url: str, *, timeout: int = 15) -> str | None:
    """Fetch a URL and return extracted text, or None on failure.

    Returns at most 15,000 characters to avoid processing huge pages.
    """
    try:
        resp = requests.get(
            url,
            headers=_HEADERS,
            timeout=timeout,
            allow_redirects=True,
        )
        resp.raise_for_status()

        content_type = resp.headers.get("Content-Type", "")
        if "html" not in content_type and "text" not in content_type:
            return None

        text = html_to_text(resp.text)
        return text[:15_000] if text else None

    except requests.RequestException as exc:
        console.print(f"[yellow]  Scrape failed for {url}: {exc}[/yellow]")
        return None
