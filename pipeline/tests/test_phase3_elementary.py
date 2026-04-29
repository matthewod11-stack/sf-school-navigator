from pipeline.extract.cde import (
    CDEPrivateSchoolRecord,
    CDEPublicSchoolRecord,
    filter_charter_elementary,
    filter_private_elementary,
)
from pipeline.extract.sfusd import SFUSDSchoolRecord, filter_elementary
from pipeline.grades import grade_span
from pipeline.transform.normalize_cde import charter_to_program, private_to_program
from pipeline.transform.normalize_sfusd import sfusd_to_program


def test_grade_span_normalizes_k_to_fifth():
    assert grade_span("K", "5") == ["k", "1", "2", "3", "4", "5"]


def test_filter_elementary_keeps_sfusd_public_elementaries():
    rows = [
        {
            "low_grade": "K",
            "high_grade": "5",
            "public_yesno": True,
            "entity_type": "Elementary Schools (Public)",
        },
        {
            "low_grade": "P",
            "high_grade": "P",
            "public_yesno": True,
            "entity_type": "Preschool",
        },
    ]

    assert filter_elementary(rows) == [rows[0]]


def test_sfusd_elementary_transform_sets_type_and_grades():
    record = {
        "school": "Test Elementary",
        "cds_code": "38684780123456",
        "status": "Active",
        "low_grade": "K",
        "high_grade": "5",
        "street_address": "123 Main St",
        "street_city": "San Francisco",
        "street_state": "CA",
        "street_zip": "94110",
        "public_yesno": True,
        "entity_type": "Elementary Schools (Public)",
    }

    row = sfusd_to_program(record=SFUSDSchoolRecord.model_validate(record), elementary=True)

    assert row["primary_type"] == "sfusd-elementary"
    assert row["grade_levels"] == ["k", "1", "2", "3", "4", "5"]


def test_private_cde_transform_uses_enrollment_grade_levels():
    record = CDEPrivateSchoolRecord.model_validate(
        {
            "CDS Code": "38684786111111",
            "County": "San Francisco",
            "Public School District": "San Francisco Unified",
            "School Name": "Private K Five",
            "Grade K Enroll": "5",
            "Grade 1 Enroll": "4",
            "Grade 2 Enroll": "0",
            "Grade 3 Enroll": "2",
            "Grade 4 Enroll": "0",
            "Grade 5 Enroll": "1",
            "Total Enrollment": "12",
        }
    )

    row = private_to_program(record)

    assert row["primary_type"] == "private-elementary"
    assert row["grade_levels"] == ["k", "1", "3", "5"]
    assert row["data_source"] == "cde"


def test_filter_private_elementary_requires_sf_and_k5_enrollment():
    rows = [
        {
            "County": "San Francisco",
            "Grade K Enroll": "1",
            "Grade 1 Enroll": "0",
            "Grade 2 Enroll": "0",
            "Grade 3 Enroll": "0",
            "Grade 4 Enroll": "0",
            "Grade 5 Enroll": "0",
        },
        {
            "County": "Alameda",
            "Grade K Enroll": "1",
            "Grade 1 Enroll": "0",
            "Grade 2 Enroll": "0",
            "Grade 3 Enroll": "0",
            "Grade 4 Enroll": "0",
            "Grade 5 Enroll": "0",
        },
    ]

    assert filter_private_elementary(rows) == [rows[0]]


def test_charter_cde_transform_sets_type_and_coordinates():
    record = CDEPublicSchoolRecord.model_validate(
        {
            "CDSCode": "38684780111111",
            "StatusType": "Active",
            "County": "San Francisco",
            "District": "San Francisco Unified",
            "School": "Charter K Eight",
            "Street": "123 Main St",
            "City": "San Francisco",
            "State": "CA",
            "Zip": "94110",
            "Phone": "(415) 555-1212",
            "WebSite": "example.org",
            "Charter": "Y",
            "SOCType": "Elementary Schools (Public)",
            "GSoffered": "K-8",
            "GSserved": "K-8",
            "Latitude": "37.77",
            "Longitude": "-122.42",
        }
    )

    row = charter_to_program(record)

    assert row["primary_type"] == "charter-elementary"
    assert row["grade_levels"] == ["k", "1", "2", "3", "4", "5"]
    assert row["coordinates"] == "SRID=4326;POINT(-122.42 37.77)"


def test_filter_charter_elementary_requires_active_sf_charter():
    rows = [
        {
            "CDSCode": "38684780111111",
            "StatusType": "Active",
            "County": "San Francisco",
            "District": "San Francisco Unified",
            "School": "Charter K Five",
            "Charter": "Y",
            "GSoffered": "K-5",
            "GSserved": "K-5",
        },
        {
            "CDSCode": "38684780222222",
            "StatusType": "Active",
            "County": "San Francisco",
            "District": "San Francisco Unified",
            "School": "Non Charter",
            "Charter": "N",
            "GSoffered": "K-5",
            "GSserved": "K-5",
        },
    ]

    assert filter_charter_elementary(rows) == [rows[0]]
