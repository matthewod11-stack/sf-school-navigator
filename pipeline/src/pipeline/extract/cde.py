"""Extract CDE private elementary and public charter school records."""

from __future__ import annotations

import csv
import io
import zipfile
import xml.etree.ElementTree as ET
from typing import Any

import httpx
from pydantic import BaseModel, Field, field_validator
from rich.console import Console

from pipeline.grades import elementary_levels_from_enrollment, grade_span

console = Console()

CDE_PRIVATE_XLSX_URL = "https://www.cde.ca.gov/ds/si/ps/documents/privateschooldata2425.xlsx"
CDE_PUBLIC_TXT_URL = "https://www.cde.ca.gov/schooldirectory/report?rid=dl1&tp=txt"


class CDEPrivateSchoolRecord(BaseModel):
    """Validated row from CDE private-school data XLSX."""

    cds_code: str = Field(alias="CDS Code")
    county: str = Field(alias="County")
    district: str = Field(alias="Public School District")
    school_name: str = Field(alias="School Name")
    grade_k_enroll: int | None = Field(default=None, alias="Grade K Enroll")
    grade_1_enroll: int | None = Field(default=None, alias="Grade 1 Enroll")
    grade_2_enroll: int | None = Field(default=None, alias="Grade 2 Enroll")
    grade_3_enroll: int | None = Field(default=None, alias="Grade 3 Enroll")
    grade_4_enroll: int | None = Field(default=None, alias="Grade 4 Enroll")
    grade_5_enroll: int | None = Field(default=None, alias="Grade 5 Enroll")
    total_enrollment: int | None = Field(default=None, alias="Total Enrollment")

    model_config = {"populate_by_name": True}

    @field_validator(
        "grade_k_enroll",
        "grade_1_enroll",
        "grade_2_enroll",
        "grade_3_enroll",
        "grade_4_enroll",
        "grade_5_enroll",
        "total_enrollment",
        mode="before",
    )
    @classmethod
    def parse_enrollment(cls, value: Any) -> int | None:
        return _parse_int(value)

    @property
    def grade_levels(self) -> list[str]:
        return elementary_levels_from_enrollment(
            {
                "k": self.grade_k_enroll,
                "1": self.grade_1_enroll,
                "2": self.grade_2_enroll,
                "3": self.grade_3_enroll,
                "4": self.grade_4_enroll,
                "5": self.grade_5_enroll,
            }
        )


class CDEPublicSchoolRecord(BaseModel):
    """Validated row from CDE public school directory TXT export."""

    cds_code: str = Field(alias="CDSCode")
    status: str = Field(alias="StatusType")
    county: str = Field(alias="County")
    district: str = Field(alias="District")
    school_name: str = Field(alias="School")
    street: str | None = Field(default=None, alias="Street")
    city: str | None = Field(default=None, alias="City")
    state: str | None = Field(default=None, alias="State")
    zip_code: str | None = Field(default=None, alias="Zip")
    phone: str | None = Field(default=None, alias="Phone")
    website: str | None = Field(default=None, alias="WebSite")
    charter: str | None = Field(default=None, alias="Charter")
    school_type: str | None = Field(default=None, alias="SOCType")
    grades_offered: str | None = Field(default=None, alias="GSoffered")
    grades_served: str | None = Field(default=None, alias="GSserved")
    latitude: str | None = Field(default=None, alias="Latitude")
    longitude: str | None = Field(default=None, alias="Longitude")

    model_config = {"populate_by_name": True}

    @property
    def grade_levels(self) -> list[str]:
        grades = self.grades_served if self.grades_served and self.grades_served != "No Data" else self.grades_offered
        if not grades or grades == "No Data":
            return []
        if "-" in grades:
            low, high = grades.split("-", 1)
            return [g for g in grade_span(low, high) if g in {"k", "1", "2", "3", "4", "5"}]
        level = grade_span(grades, grades)
        return [g for g in level if g in {"k", "1", "2", "3", "4", "5"}]


def _parse_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _xlsx_rows(content: bytes) -> list[dict[str, str]]:
    """Read the first worksheet from a simple XLSX file."""
    namespace = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(io.BytesIO(content)) as workbook:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in workbook.namelist():
            root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
            for item in root.findall("x:si", namespace):
                shared_strings.append("".join(t.text or "" for t in item.findall(".//x:t", namespace)))

        worksheet_name = next(
            name for name in workbook.namelist() if name.startswith("xl/worksheets/sheet")
        )
        worksheet = ET.fromstring(workbook.read(worksheet_name))

    rows: list[list[str]] = []
    for row in worksheet.findall(".//x:row", namespace):
        values: list[str] = []
        current_col = 0
        for cell in row.findall("x:c", namespace):
            ref = cell.attrib.get("r", "")
            col_letters = "".join(ch for ch in ref if ch.isalpha())
            if col_letters:
                col_index = 0
                for ch in col_letters:
                    col_index = col_index * 26 + (ord(ch.upper()) - ord("A") + 1)
                while current_col < col_index - 1:
                    values.append("")
                    current_col += 1
            raw = cell.find("x:v", namespace)
            value = "" if raw is None else raw.text or ""
            if cell.attrib.get("t") == "s" and value:
                value = shared_strings[int(value)]
            values.append(value)
            current_col += 1
        rows.append(values)

    header_index = next(
        i for i, row in enumerate(rows) if row and row[0].strip().lower() == "cds code"
    )
    headers = rows[header_index]
    return [
        {headers[i]: row[i] if i < len(row) else "" for i in range(len(headers))}
        for row in rows[header_index + 1 :]
        if row and any(cell.strip() for cell in row)
    ]


def download_private_school_rows(url: str = CDE_PRIVATE_XLSX_URL) -> list[dict[str, str]]:
    console.print("[blue]Downloading CDE private school data...[/blue]")
    with httpx.Client(timeout=60, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()
    rows = _xlsx_rows(response.content)
    console.print(f"[green]Downloaded {len(rows)} private school rows[/green]")
    return rows


def download_public_school_rows(url: str = CDE_PUBLIC_TXT_URL) -> list[dict[str, str]]:
    console.print("[blue]Downloading CDE public school directory data...[/blue]")
    with httpx.Client(timeout=120, follow_redirects=True) as client:
        response = client.get(url)
        response.raise_for_status()
    reader = csv.DictReader(io.StringIO(response.text), delimiter="\t")
    rows = list(reader)
    console.print(f"[green]Downloaded {len(rows)} public school rows[/green]")
    return rows


def filter_private_elementary(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    filtered = []
    for row in rows:
        if row.get("County", "").strip().lower() != "san francisco":
            continue
        enrollment = {
            "k": _parse_int(row.get("Grade K Enroll")),
            "1": _parse_int(row.get("Grade 1 Enroll")),
            "2": _parse_int(row.get("Grade 2 Enroll")),
            "3": _parse_int(row.get("Grade 3 Enroll")),
            "4": _parse_int(row.get("Grade 4 Enroll")),
            "5": _parse_int(row.get("Grade 5 Enroll")),
        }
        if elementary_levels_from_enrollment(enrollment):
            filtered.append(row)
    console.print(f"[green]Filtered to {len(filtered)} SF private K-5 schools[/green]")
    return filtered


def filter_charter_elementary(rows: list[dict[str, str]]) -> list[dict[str, str]]:
    filtered = []
    for row in rows:
        if row.get("County", "").strip().lower() != "san francisco":
            continue
        if row.get("StatusType") != "Active" or row.get("Charter") != "Y":
            continue
        record = CDEPublicSchoolRecord.model_validate(row)
        if record.grade_levels:
            filtered.append(row)
    console.print(f"[green]Filtered to {len(filtered)} SF charter K-5 schools[/green]")
    return filtered


def validate_private_records(rows: list[dict[str, str]]) -> list[CDEPrivateSchoolRecord]:
    records = [CDEPrivateSchoolRecord.model_validate(row) for row in rows]
    console.print(f"[green]Validated {len(records)} private school records[/green]")
    return records


def validate_public_records(rows: list[dict[str, str]]) -> list[CDEPublicSchoolRecord]:
    records = [CDEPublicSchoolRecord.model_validate(row) for row in rows]
    console.print(f"[green]Validated {len(records)} charter school records[/green]")
    return records


def extract_cde_private_elementary(*, limit: int | None = None) -> list[CDEPrivateSchoolRecord]:
    rows = filter_private_elementary(download_private_school_rows())
    records = validate_private_records(rows)
    if limit:
        records = records[:limit]
        console.print(f"[blue]Limited private records to {limit}[/blue]")
    return records


def extract_cde_charter_elementary(*, limit: int | None = None) -> list[CDEPublicSchoolRecord]:
    rows = filter_charter_elementary(download_public_school_rows())
    records = validate_public_records(rows)
    if limit:
        records = records[:limit]
        console.print(f"[blue]Limited charter records to {limit}[/blue]")
    return records
