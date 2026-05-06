from typing import Any

from sqlalchemy.orm import Session

from app.services.rag.retrieval import search_rules


def build_answer(result: dict[str, Any]) -> str:
    rule_number = result.get("rule_number", "Unknown")
    section = result.get("section", "Unknown section")
    text = result.get("text", "")

    return (
        f"According to Rule {rule_number} under {section}, "
        f"{text}"
    )


def answer_question(db: Session, question: str) -> dict[str, Any]:
    if not question or not question.strip():
        return {
            "answer": "Please ask a question about the hall rules.",
            "matched_rules": [],
        }

    search_output = search_rules(db, question.strip(), top_k=3)
    results = search_output.get("results", [])

    if not results:
        return {
            "answer": "I could not find a relevant answer in the hall rules.",
            "matched_rules": [],
        }

    top_result = results[0]

    matched_rules = [
        {
            "id": item["id"],
            "rule_number": item["rule_number"],
            "section": item["section"],
            "page": item["page"],
            "text": item["text"],
        }
        for item in results
    ]

    return {
        "answer": build_answer(top_result),
        "matched_rules": matched_rules,
    }