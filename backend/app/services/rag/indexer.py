import os

os.environ["ANONYMIZED_TELEMETRY"] = "False"

from pathlib import Path
from typing import Iterable

import chromadb
from sentence_transformers import SentenceTransformer

from app.models.hall_rule import HallRule


APP_DIR = Path(__file__).resolve().parents[2]
DB_DIR = APP_DIR / "data" / "vectordb"

COLLECTION_NAME = "hostel_rules"
MODEL_NAME = "all-MiniLM-L6-v2"


model = SentenceTransformer(MODEL_NAME)
client = chromadb.PersistentClient(path=str(DB_DIR))
collection = client.get_or_create_collection(COLLECTION_NAME)


def make_rule_id(rule_number: int) -> str:
    return f"rule_{rule_number}"


def make_rule_document(rule: HallRule) -> str:
    return (
        f"Section: {rule.section}\n"
        f"Rule Number: {rule.rule_number}\n"
        f"Page: {rule.page or 0}\n"
        f"Rule Text: {rule.text}"
    )


def upsert_rule_to_vector_db(rule: HallRule) -> None:
    if not rule.is_active:
        delete_rule_from_vector_db(rule.rule_number)
        return

    document = make_rule_document(rule)

    embedding = model.encode(
        [document],
        normalize_embeddings=True,
    ).tolist()[0]

    collection.upsert(
        ids=[make_rule_id(rule.rule_number)],
        documents=[document],
        embeddings=[embedding],
        metadatas=[
            {
                "rule_number": rule.rule_number,
                "section": rule.section,
                "page": rule.page or 0,
            }
        ],
    )


def delete_rule_from_vector_db(rule_number: int) -> None:
    try:
        collection.delete(ids=[make_rule_id(rule_number)])
    except Exception:
        pass


def rebuild_vector_db(rules: Iterable[HallRule]) -> int:
    active_rules = [rule for rule in rules if rule.is_active]

    if not active_rules:
        return 0

    ids = []
    documents = []
    metadatas = []

    for rule in active_rules:
        ids.append(make_rule_id(rule.rule_number))
        documents.append(make_rule_document(rule))
        metadatas.append(
            {
                "rule_number": rule.rule_number,
                "section": rule.section,
                "page": rule.page or 0,
            }
        )

    embeddings = model.encode(
        documents,
        normalize_embeddings=True,
    ).tolist()

    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )

    return len(active_rules)