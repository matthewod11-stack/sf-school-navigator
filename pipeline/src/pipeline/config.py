"""Configuration — loads env vars, creates Supabase client."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

# Load pipeline-specific env first, then root app env used by local Next.js.
_pipeline_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_repo_root = os.path.dirname(_pipeline_root)
load_dotenv(os.path.join(_pipeline_root, ".env"))
load_dotenv(os.path.join(_repo_root, ".env.local"))
load_dotenv(os.path.join(_repo_root, ".env"))


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"{name} environment variable is required")
    return val


CCL_DATASTORE_SEARCH_URL = "https://data.chhs.ca.gov/api/3/action/datastore_search"
CCL_CENTER_RESOURCE_ID = "7aed8063-cea7-4367-8651-c81643164ae0"
CCL_FAMILY_HOME_RESOURCE_ID = "4b5cc48d-03b1-4f42-a7d1-b9816903eb2b"


@lru_cache(maxsize=1)
def get_supabase_url() -> str:
    return os.environ.get("SUPABASE_URL") or _require_env("NEXT_PUBLIC_SUPABASE_URL")


@lru_cache(maxsize=1)
def get_supabase_service_key() -> str:
    return (
        os.environ.get("SUPABASE_SERVICE_KEY")
        or _require_env("SUPABASE_SERVICE_ROLE_KEY")
    )


@lru_cache(maxsize=1)
def get_mapbox_token() -> str:
    return (
        os.environ.get("MAPBOX_ACCESS_TOKEN")
        or os.environ.get("NEXT_PUBLIC_MAPBOX_TOKEN")
        or os.environ.get("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN")
        or ""
    )


# Singleton client (service role — bypasses RLS)
_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(get_supabase_url(), get_supabase_service_key())
    return _client
