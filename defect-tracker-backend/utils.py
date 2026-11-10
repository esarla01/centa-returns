"""Small helpers shared by the endpoints."""

TURKISH_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"]


def format_tr_datetime(value):
    """12 Haz 2024 14:05 — or None when there is no value."""
    if not value:
        return None
    return f"{value.day:02d} {TURKISH_MONTHS[value.month - 1]} {value.year} {value.hour:02d}:{value.minute:02d}"
