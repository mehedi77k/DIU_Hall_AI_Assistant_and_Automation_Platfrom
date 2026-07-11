import json
from pathlib import Path

from sqlalchemy.exc import IntegrityError

from app.db.session import SessionLocal
from app.models.hall_rule import HallRule


DATA_FILE = (
    Path(__file__).resolve().parents[1]
    / "data"
    / "processed"
    / "chunks_updated.json"
)


def seed_hall_rules_from_json() -> None:
    """
    Seed hall_rules table from:
    backend/app/data/processed/chunks_updated.json

    This function runs on backend startup.
    It will insert only missing rules.
    Existing rule_number will be skipped.
    """

    db = SessionLocal()

    try:
        if not DATA_FILE.exists():
            print(f"[HallRule Seed] JSON file not found: {DATA_FILE}")
            return

        with DATA_FILE.open("r", encoding="utf-8") as file:
            rules_data = json.load(file)

        if not isinstance(rules_data, list):
            print("[HallRule Seed] Invalid JSON format. Expected a list of rules.")
            return

        existing_rule_numbers = {
            rule_number
            for (rule_number,) in db.query(HallRule.rule_number).all()
        }

        inserted = 0
        skipped = 0

        for item in rules_data:
            if not isinstance(item, dict):
                skipped += 1
                continue

            rule_number = item.get("rule_number")
            section = item.get("section")
            page = item.get("page")
            text = item.get("text")

            if rule_number is None or not section or not text:
                print(f"[HallRule Seed] Skipped invalid item: {item}")
                skipped += 1
                continue

            rule_number = int(rule_number)

            if rule_number in existing_rule_numbers:
                skipped += 1
                continue

            rule = HallRule(
                rule_number=rule_number,
                section=str(section),
                page=int(page) if page is not None else None,
                text=str(text),
                is_active=True,
            )

            db.add(rule)
            existing_rule_numbers.add(rule_number)
            inserted += 1

        db.commit()

        print(
            f"[HallRule Seed] Completed. Inserted: {inserted}, Skipped: {skipped}"
        )

    except IntegrityError as e:
        db.rollback()
        print(f"[HallRule Seed] Database integrity error: {e}")

    except Exception as e:
        db.rollback()
        print(f"[HallRule Seed] Failed: {e}")
        raise

    finally:
        db.close()