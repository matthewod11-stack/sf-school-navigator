"""Configuration — loads env vars, creates Supabase client."""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv
from supabase import Client, create_client

# Load .env from pipeline root (two levels up from this file)
_pipeline_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_pipeline_root, ".env"))


def _require_env(name: str) -> str:
    val = os.environ.get(name)
    if not val:
        raise RuntimeError(f"{name} environment variable is required")
    return val


CCL_CSV_URL = (
    "https://data.chhs.ca.gov/dataset/"
    "46ffcbdf-4874-4cc1-92c2-fb715e3ad014/resource/"
    "7aed8063-cea7-4367-8651-c81643164ae0/download/tmpwya01y9s.csv"
)


@lru_cache(maxsize=1)
def get_supabase_url() -> str:
    return _require_env("SUPABASE_URL")


@lru_cache(maxsize=1)
def get_supabase_service_key() -> str:
    return _require_env("SUPABASE_SERVICE_KEY")


@lru_cache(maxsize=1)
def get_mapbox_token() -> str:
    return os.environ.get("MAPBOX_ACCESS_TOKEN", "")


# Singleton client (service role — bypasses RLS)
_client: Client | None = None


def get_supabase() -> Client:
    global _client
    if _client is None:
        _client = create_client(get_supabase_url(), get_supabase_service_key())
    return _client
