"""Extract structured enrichment fields from scraped text and program metadata.

For programs with website text, we use regex-based extraction.
For SFUSD programs without scrapeable sites, we apply known SFUSD defaults.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any


@dataclass
class EnrichmentData:
    """Structured enrichment data extracted for a program."""

    program_id: str
    program_name: str

    # Schedules
    schedules: list[dict[str, Any]] = field(default_factory=list)

    # Costs
    costs: list[dict[str, Any]] = field(default_factory=list)

    # Languages
    languages: list[dict[str, str]] = field(default_factory=list)

    # Deadlines
    deadlines: list[dict[str, Any]] = field(default_factory=list)

    # Provenance raw snippets (field_name -> raw_snippet)
    provenance: dict[str, str] = field(default_factory=dict)

    # Programs table updates
    program_updates: dict[str, Any] = field(default_factory=dict)

    @property
    def has_data(self) -> bool:
        return bool(self.schedules or self.costs or self.languages or self.deadlines)


# ── SFUSD defaults ─────────────────────────────────────────────────────────

_SFUSD_TK_SCHEDULE = {
    "schedule_type": "full-day",
    "days_per_week": 5,
    "open_time": "07:50:00",
    "close_time": "14:20:00",
    "extended_care_available": True,
    "summer_program": False,
    "operates": "school-year",
}

_SFUSD_PREK_SCHEDULE_FULL = {
    "schedule_type": "full-day",
    "days_per_week": 5,
    "open_time": "07:45:00",
    "close_time": "14:15:00",
    "extended_care_available": True,
    "summer_program": False,
    "operates": "school-year",
}

_SFUSD_PREK_SCHEDULE_HALF = {
    "schedule_type": "half-day-am",
    "days_per_week": 5,
    "open_time": "07:45:00",
    "close_time": "11:30:00",
    "extended_care_available": False,
    "summer_program": False,
    "operates": "school-year",
}


def enrich_sfusd_program(program: dict) -> EnrichmentData:
    """Enrich an SFUSD program with known defaults.

    SFUSD TK and Pre-K are tuition-free public programs with standard schedules.
    """
    pid = program["id"]
    ptype = program["primary_type"]
    name = program["name"]

    data = EnrichmentData(program_id=pid, program_name=name)

    # Schedule
    if ptype == "sfusd-tk":
        data.schedules.append({**_SFUSD_TK_SCHEDULE, "program_id": pid})
        data.provenance["schedule"] = "SFUSD TK standard schedule: 7:50am-2:20pm, M-F, school year"
    elif ptype == "sfusd-prek":
        data.schedules.append({**_SFUSD_PREK_SCHEDULE_FULL, "program_id": pid})
        data.schedules.append({**_SFUSD_PREK_SCHEDULE_HALF, "program_id": pid})
        data.provenance["schedule"] = (
            "SFUSD Pre-K offers full-day (7:45am-2:15pm) and half-day (7:45am-11:30am)"
        )

    # Cost — SFUSD is free
    data.costs.append({
        "program_id": pid,
        "school_year": "2026-27",
        "tuition_monthly_low": 0,
        "tuition_monthly_high": 0,
        "registration_fee": 0,
        "deposit": 0,
        "accepts_subsidies": True,
        "financial_aid_available": False,
    })
    data.provenance["cost"] = "SFUSD public programs are tuition-free"

    # Language — default English; detect immersion from name
    lang = _detect_language_from_name(name)
    data.languages.append({
        "program_id": pid,
        "language": lang["language"],
        "immersion_type": lang["immersion_type"],
    })
    data.provenance["language"] = f"Detected from program name: {name}"

    # Deadlines — SFUSD centralized enrollment
    data.deadlines.append({
        "program_id": pid,
        "school_year": "2026-27",
        "deadline_type": "application-open",
        "description": "SFUSD enrollment opens via centralized application",
        "generic_deadline_estimate": "November-January (check SFUSD enrollment page)",
        "source_url": "https://www.sfusd.edu/enroll",
    })
    data.deadlines.append({
        "program_id": pid,
        "school_year": "2026-27",
        "deadline_type": "application-close",
        "description": "SFUSD enrollment application deadline",
        "generic_deadline_estimate": "January-February (check SFUSD enrollment page)",
        "source_url": "https://www.sfusd.edu/enroll",
    })
    data.provenance["deadline"] = "SFUSD centralized enrollment process — sfusd.edu/enroll"

    # Program updates
    data.program_updates["last_verified_at"] = "2026-02-11T00:00:00+00:00"

    return data


def _detect_language_from_name(name: str) -> dict[str, str]:
    """Detect language immersion from program name."""
    name_lower = name.lower()

    immersion_keywords = {
        "chinese immersion": ("Mandarin", "full"),
        "mandarin immersion": ("Mandarin", "full"),
        "spanish immersion": ("Spanish", "full"),
        "cantonese immersion": ("Cantonese", "full"),
        "japanese": ("Japanese", "dual"),
        "bilingual": ("Spanish", "dual"),
        "korean": ("Korean", "dual"),
        "filipino": ("Filipino", "dual"),
    }

    for keyword, (language, imm_type) in immersion_keywords.items():
        if keyword in name_lower:
            return {"language": language, "immersion_type": imm_type}

    return {"language": "English", "immersion_type": "full"}


# ── Website-scraped extraction ─────────────────────────────────────────────

# Tuition patterns
_COST_PATTERNS = [
    # "$1,234/month", "$1234 per month", "$1,234 monthly"
    re.compile(r"\$\s*([\d,]+)\s*(?:/|per)\s*month", re.IGNORECASE),
    re.compile(r"\$\s*([\d,]+)\s*monthly", re.IGNORECASE),
    # "$1234 - $2345 / month"
    re.compile(r"\$\s*([\d,]+)\s*[-–]\s*\$\s*([\d,]+)\s*(?:/|per)\s*month", re.IGNORECASE),
    # "tuition: $1234"
    re.compile(r"tuition[:\s]+\$\s*([\d,]+)", re.IGNORECASE),
]

_FEE_PATTERNS = [
    re.compile(r"registration\s*(?:fee)?[:\s]+\$\s*([\d,]+)", re.IGNORECASE),
    re.compile(r"(?:enrollment|application)\s*fee[:\s]+\$\s*([\d,]+)", re.IGNORECASE),
]

_DEPOSIT_PATTERNS = [
    re.compile(r"deposit[:\s]+\$\s*([\d,]+)", re.IGNORECASE),
]

# Schedule patterns
_HOURS_PATTERN = re.compile(
    r"(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*[-–to]+\s*(\d{1,2}:\d{2}\s*(?:am|pm)?)",
    re.IGNORECASE,
)
_DAYS_PATTERN = re.compile(
    r"(monday|tuesday|wednesday|thursday|friday|mon|tue|wed|thu|fri)"
    r".*?(monday|tuesday|wednesday|thursday|friday|mon|tue|wed|thu|fri)",
    re.IGNORECASE,
)
_FULL_DAY_PATTERN = re.compile(r"full[\s-]*day", re.IGNORECASE)
_HALF_DAY_PATTERN = re.compile(r"half[\s-]*day", re.IGNORECASE)
_EXTENDED_CARE_PATTERN = re.compile(
    r"(extended\s*(?:care|day)|before[\s/&]*after\s*(?:care|school)|wrap[\s-]*around)",
    re.IGNORECASE,
)
_SUMMER_PATTERN = re.compile(r"summer\s*(?:program|camp|session)", re.IGNORECASE)

# Language patterns
_LANGUAGE_PATTERNS = {
    "Spanish": re.compile(r"\b(spanish|espa[ñn]ol|bilingual)\b", re.IGNORECASE),
    "Mandarin": re.compile(r"\b(mandarin|chinese(?:\s+immersion)?)\b", re.IGNORECASE),
    "Cantonese": re.compile(r"\bcantonese\b", re.IGNORECASE),
    "Japanese": re.compile(r"\bjapanese\b", re.IGNORECASE),
    "French": re.compile(r"\bfrench\b", re.IGNORECASE),
    "Korean": re.compile(r"\bkorean\b", re.IGNORECASE),
    "Filipino": re.compile(r"\bfilipino\b", re.IGNORECASE),
}

# Philosophy patterns
_PHILOSOPHY_PATTERNS = {
    "montessori": re.compile(r"\bmontessori\b", re.IGNORECASE),
    "waldorf": re.compile(r"\bwaldorf\b", re.IGNORECASE),
    "reggio": re.compile(r"\breggio\b", re.IGNORECASE),
    "play-based": re.compile(r"\bplay[\s-]*based\b", re.IGNORECASE),
    "project-based": re.compile(r"\bproject[\s-]*based\b", re.IGNORECASE),
    "stem": re.compile(r"\bst(?:e|ea)m\b", re.IGNORECASE),
    "nature": re.compile(r"\bnature[\s-]*(?:based|school|preschool)\b", re.IGNORECASE),
    "faith-based": re.compile(
        r"\b(faith|christian|catholic|jewish|islamic|religious)\b", re.IGNORECASE
    ),
}

# Staff ratio
_RATIO_PATTERN = re.compile(r"(\d+)\s*[:-]\s*(\d+)\s*(?:ratio|staff|teacher)", re.IGNORECASE)
_RATIO_PATTERN2 = re.compile(r"(?:ratio|staff|teacher)[:\s]+(\d+)\s*[:-]\s*(\d+)", re.IGNORECASE)

# Subsidies / financial aid
_SUBSIDY_PATTERN = re.compile(
    r"\b(subsid|voucher|c4k|calworks|head\s*start|sliding\s*scale|income[\s-]*based)\b",
    re.IGNORECASE,
)
_AID_PATTERN = re.compile(
    r"\b(financial\s*aid|scholarship|tuition\s*assist|need[\s-]*based)\b", re.IGNORECASE
)


def _parse_cost(amount_str: str) -> float | None:
    """Parse '$1,234' -> 1234.0"""
    cleaned = amount_str.replace(",", "").replace("$", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return None


def _normalize_time(time_str: str) -> str | None:
    """Normalize time string to HH:MM:SS format."""
    time_str = time_str.strip().lower()
    match = re.match(r"(\d{1,2}):(\d{2})\s*(am|pm)?", time_str)
    if not match:
        return None
    hour, minute = int(match.group(1)), int(match.group(2))
    ampm = match.group(3)
    if ampm == "pm" and hour < 12:
        hour += 12
    elif ampm == "am" and hour == 12:
        hour = 0
    return f"{hour:02d}:{minute:02d}:00"


def _extract_snippet(text: str, pattern: re.Pattern, context_chars: int = 120) -> str | None:
    """Extract a snippet of text around a regex match for provenance."""
    match = pattern.search(text)
    if not match:
        return None
    start = max(0, match.start() - context_chars // 2)
    end = min(len(text), match.end() + context_chars // 2)
    snippet = text[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(text):
        snippet = snippet + "..."
    return snippet


def enrich_from_website(program: dict, page_text: str) -> EnrichmentData:
    """Extract structured data from scraped page text for a program."""
    pid = program["id"]
    name = program["name"]
    data = EnrichmentData(program_id=pid, program_name=name)

    # ── Costs ──
    monthly_low: float | None = None
    monthly_high: float | None = None
    reg_fee: float | None = None
    deposit: float | None = None

    # Try range pattern first
    range_pat = _COST_PATTERNS[3]  # "tuition: $X"
    for pat in _COST_PATTERNS:
        m = pat.search(page_text)
        if m:
            groups = m.groups()
            if len(groups) == 2:
                monthly_low = _parse_cost(groups[0])
                monthly_high = _parse_cost(groups[1])
            elif len(groups) == 1:
                val = _parse_cost(groups[0])
                monthly_low = val
                monthly_high = val
            break

    for pat in _FEE_PATTERNS:
        m = pat.search(page_text)
        if m:
            reg_fee = _parse_cost(m.group(1))
            break

    for pat in _DEPOSIT_PATTERNS:
        m = pat.search(page_text)
        if m:
            deposit = _parse_cost(m.group(1))
            break

    if monthly_low is not None or reg_fee is not None:
        accepts_subsidies = bool(_SUBSIDY_PATTERN.search(page_text))
        financial_aid = bool(_AID_PATTERN.search(page_text))
        data.costs.append({
            "program_id": pid,
            "school_year": "2026-27",
            "tuition_monthly_low": monthly_low,
            "tuition_monthly_high": monthly_high,
            "registration_fee": reg_fee,
            "deposit": deposit,
            "accepts_subsidies": accepts_subsidies,
            "financial_aid_available": financial_aid,
        })
        snippet = _extract_snippet(page_text, _COST_PATTERNS[0]) or "Cost information extracted"
        data.provenance["cost"] = snippet

    # ── Schedule ──
    hours_match = _HOURS_PATTERN.search(page_text)
    open_time = None
    close_time = None
    if hours_match:
        open_time = _normalize_time(hours_match.group(1))
        close_time = _normalize_time(hours_match.group(2))

    has_full = bool(_FULL_DAY_PATTERN.search(page_text))
    has_half = bool(_HALF_DAY_PATTERN.search(page_text))
    has_extended = bool(_EXTENDED_CARE_PATTERN.search(page_text))
    has_summer = bool(_SUMMER_PATTERN.search(page_text))

    # At minimum add a full-day schedule if we found any signal
    if open_time or has_full or has_half:
        sched_type = "full-day"
        if has_half and not has_full:
            sched_type = "half-day-am"

        data.schedules.append({
            "program_id": pid,
            "schedule_type": sched_type,
            "days_per_week": 5,
            "open_time": open_time,
            "close_time": close_time,
            "extended_care_available": has_extended,
            "summer_program": has_summer,
            "operates": "full-year" if has_summer else "school-year",
        })
        snippet_text = (
            _extract_snippet(page_text, _HOURS_PATTERN)
            or _extract_snippet(page_text, _FULL_DAY_PATTERN)
            or "Schedule information found"
        )
        data.provenance["schedule"] = snippet_text

    # ── Languages ──
    detected_langs: list[dict[str, str]] = []
    for lang_name, pat in _LANGUAGE_PATTERNS.items():
        if pat.search(page_text):
            imm_type = "dual" if lang_name != "English" else "full"
            # Check if the word "immersion" appears near the language mention
            imm_check = re.search(
                rf"\b{lang_name}\b.*?\bimmersion\b|\bimmersion\b.*?\b{lang_name}\b",
                page_text,
                re.IGNORECASE,
            )
            if imm_check:
                imm_type = "full"
            detected_langs.append({
                "program_id": pid,
                "language": lang_name,
                "immersion_type": imm_type,
            })

    if detected_langs:
        data.languages = detected_langs
        lang_names = ", ".join(d["language"] for d in detected_langs)
        data.provenance["language"] = f"Languages detected: {lang_names}"
    else:
        # Default to English
        data.languages.append({
            "program_id": pid,
            "language": "English",
            "immersion_type": "full",
        })
        data.provenance["language"] = "No specific language program detected; defaulting to English"

    # ── Deadlines ──
    # Look for deadline-related text
    deadline_text = _extract_snippet(
        page_text,
        re.compile(r"\b(deadline|enroll|apply|application|admission|registration)\b", re.IGNORECASE),
        context_chars=200,
    )
    if deadline_text:
        data.deadlines.append({
            "program_id": pid,
            "school_year": "2026-27",
            "deadline_type": "application-open",
            "description": "Visit program website for application details",
            "generic_deadline_estimate": "Check program website for current deadlines",
            "source_url": program.get("website"),
        })
        data.provenance["deadline"] = deadline_text

    # ── Program updates ──
    data.program_updates["last_verified_at"] = "2026-02-11T00:00:00+00:00"

    return data


def enrich_with_defaults(program: dict) -> EnrichmentData:
    """Create minimal enrichment for programs without scrapeable websites.

    Uses program type norms for SF childcare centers.
    """
    pid = program["id"]
    name = program["name"]
    ptype = program["primary_type"]

    data = EnrichmentData(program_id=pid, program_name=name)

    # Default schedule for childcare centers
    data.schedules.append({
        "program_id": pid,
        "schedule_type": "full-day",
        "days_per_week": 5,
        "open_time": "07:30:00",
        "close_time": "17:30:00",
        "extended_care_available": False,
        "summer_program": True,
        "operates": "full-year",
    })
    data.provenance["schedule"] = (
        "Default SF childcare center schedule estimate: 7:30am-5:30pm, M-F, full year"
    )

    # Language — English default
    lang = _detect_language_from_name(name)
    data.languages.append({
        "program_id": pid,
        "language": lang["language"],
        "immersion_type": lang["immersion_type"],
    })
    data.provenance["language"] = f"Detected from program name: {name}"

    # Cost — generic estimate for private centers
    data.costs.append({
        "program_id": pid,
        "school_year": "2026-27",
        "tuition_monthly_low": None,
        "tuition_monthly_high": None,
        "registration_fee": None,
        "deposit": None,
        "accepts_subsidies": False,
        "financial_aid_available": False,
    })
    data.provenance["cost"] = "Contact program for current tuition rates"

    # Deadline — generic
    data.deadlines.append({
        "program_id": pid,
        "school_year": "2026-27",
        "deadline_type": "application-open",
        "description": "Contact program for enrollment information",
        "generic_deadline_estimate": "Contact program for dates",
        "source_url": program.get("website"),
    })
    data.provenance["deadline"] = "No deadline information available — contact program"

    data.program_updates["last_verified_at"] = "2026-02-11T00:00:00+00:00"

    return data
