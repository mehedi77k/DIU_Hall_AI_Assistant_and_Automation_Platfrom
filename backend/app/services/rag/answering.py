import logging
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.rag.retrieval import search_rules

try:
    from groq import Groq
except Exception:  # pragma: no cover
    Groq = None

try:
    from google import genai
    from google.genai import types
except Exception:  # pragma: no cover
    genai = None
    types = None


logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """
You are SmartHall AI, a helpful assistant for DIU hall-management rules.

You must follow these rules:
1. Answer only from the provided hall-rule context.
2. If the context does not contain the answer, say:
   "I could not find this information in the hall rules."
3. Do not invent rules, deadlines, punishments, fees, names, offices, or procedures.
4. If multiple rules are relevant, combine them into one clear answer.
5. Mention rule numbers when available.
6. Use a friendly but concise tone.
7. If the student asks in Bangla, Banglish, or mixed Bangla-English, answer naturally in the same style.
8. If the question is unsafe, abusive, or unrelated to hall rules, politely redirect to hall-rule topics.
""".strip()


def build_fallback_answer(result: dict[str, Any]) -> str:
    rule_number = result.get("rule_number", "Unknown")
    section = result.get("section", "Unknown section")
    text = result.get("text", "")

    return (
        f"According to Rule {rule_number} under {section}, "
        f"{text}"
    )


def build_context(matched_rules: list[dict[str, Any]]) -> str:
    context_blocks = []

    for index, rule in enumerate(matched_rules, start=1):
        rule_number = rule.get("rule_number", "Unknown")
        section = rule.get("section", "Unknown section")
        page = rule.get("page", "N/A")
        text = rule.get("text", "")

        context_blocks.append(
            "\n".join(
                [
                    f"[Source {index}]",
                    f"Rule Number: {rule_number}",
                    f"Section: {section}",
                    f"Page: {page}",
                    f"Rule Text: {text}",
                ]
            )
        )

    return "\n\n---\n\n".join(context_blocks)


def build_user_prompt(question: str, context: str) -> str:
    return f"""
Student question:
{question}

Hall-rule context:
{context}

Write the final answer for the student.
""".strip()


def generate_with_groq(question: str, context: str) -> str | None:
    if not settings.groq_api_key:
        return None

    if Groq is None:
        logger.warning("Groq SDK is not installed.")
        return None

    client = Groq(api_key=settings.groq_api_key)

    completion = client.chat.completions.create(
        model=settings.groq_model,
        temperature=settings.llm_temperature,
        max_tokens=settings.llm_max_output_tokens,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": build_user_prompt(question, context),
            },
        ],
    )

    answer = completion.choices[0].message.content

    if not answer:
        return None

    return answer.strip()


def generate_with_gemini(question: str, context: str) -> str | None:
    if not settings.gemini_api_key:
        return None

    if genai is None or types is None:
        logger.warning("Google Gen AI SDK is not installed.")
        return None

    client = genai.Client(api_key=settings.gemini_api_key)

    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=build_user_prompt(question, context),
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=settings.llm_temperature,
            max_output_tokens=settings.llm_max_output_tokens,
        ),
    )

    answer = getattr(response, "text", None)

    if not answer:
        return None

    return answer.strip()


def generate_llm_answer(question: str, matched_rules: list[dict[str, Any]]) -> str:
    context = build_context(matched_rules)

    try:
        groq_answer = generate_with_groq(question, context)
        if groq_answer:
            return groq_answer
    except Exception:
        logger.exception("Groq generation failed. Falling back to Gemini.")

    try:
        gemini_answer = generate_with_gemini(question, context)
        if gemini_answer:
            return gemini_answer
    except Exception:
        logger.exception("Gemini generation failed. Falling back to raw rule answer.")

    return build_fallback_answer(matched_rules[0])


def answer_question(db: Session, question: str) -> dict[str, Any]:
    if not question or not question.strip():
        return {
            "answer": "Please ask a question about the hall rules.",
            "matched_rules": [],
        }

    clean_question = question.strip()

    search_output = search_rules(db, clean_question, top_k=3)
    results = search_output.get("results", [])

    if not results:
        return {
            "answer": "I could not find a relevant answer in the hall rules.",
            "matched_rules": [],
        }

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

    if not settings.llm_enabled:
        return {
            "answer": build_fallback_answer(results[0]),
            "matched_rules": matched_rules,
        }

    answer = generate_llm_answer(clean_question, matched_rules)

    return {
        "answer": answer,
        "matched_rules": matched_rules,
    }