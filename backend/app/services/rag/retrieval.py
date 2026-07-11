import os

os.environ["ANONYMIZED_TELEMETRY"] = "False"

import re
from pathlib import Path
from typing import Any

import chromadb
from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from transformers import logging as hf_logging

from app.models.hall_rule import HallRule

hf_logging.set_verbosity_error()


APP_DIR = Path(__file__).resolve().parents[2]
DB_DIR = APP_DIR / "data" / "vectordb"

COLLECTION_NAME = "hostel_rules"
MODEL_NAME = "all-MiniLM-L6-v2"


model = SentenceTransformer(MODEL_NAME)
client = chromadb.PersistentClient(path=str(DB_DIR))
collection = client.get_or_create_collection(COLLECTION_NAME)


def extract_rule_number(query: str) -> int | None:
    match = re.search(r"\brule\s+(\d{1,3})\b", query.lower())

    if match:
        return int(match.group(1))

    return None


def get_rule_by_number(db: Session, rule_number: int) -> HallRule | None:
    return (
        db.query(HallRule)
        .filter(HallRule.rule_number == rule_number)
        .filter(HallRule.is_active == True)
        .first()
    )


def format_rule(rule: HallRule, distance: float = 0.0) -> dict[str, Any]:
    return {
        "id": f"rule_{rule.rule_number}",
        "rule_number": rule.rule_number,
        "section": rule.section,
        "page": rule.page or 0,
        "text": rule.text,
        "distance": distance,
    }


def semantic_search(
    db: Session,
    query: str,
    top_k: int = 3,
) -> list[dict[str, Any]]:
    query_embedding = model.encode(
        [query],
        normalize_embeddings=True,
    ).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        include=["metadatas", "distances"],
    )

    metadatas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    formatted_results = []

    for metadata, distance in zip(metadatas, distances):
        rule_number = int(metadata.get("rule_number"))

        rule = get_rule_by_number(db, rule_number)

        if not rule:
            continue

        formatted_results.append(format_rule(rule, float(distance)))

    return formatted_results


def search_rules(
    db: Session,
    query: str,
    top_k: int = 3,
) -> dict[str, Any]:
    rule_number = extract_rule_number(query)

    if rule_number is not None:
        exact_rule = get_rule_by_number(db, rule_number)

        if exact_rule:
            return {
                "mode": "exact_rule",
                "results": [format_rule(exact_rule, distance=0.0)],
            }

    return {
        "mode": "semantic",
        "results": semantic_search(db, query, top_k=top_k),
    }