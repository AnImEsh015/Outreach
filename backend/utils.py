"""
Utility functions for the outreach tool.
Includes robust email list parsing.
"""

import re
import json
from groq import Groq

_company_cache = {}

def resolve_company_name(domain: str, groq_api_key: str) -> str:
    """
    Resolve proper company name from domain using Groq only.
    No web search — Groq's training data knows most companies,
    and can intelligently parse unknown domain names.
    """
    domain_clean = domain.lower().strip()

    if domain_clean in _company_cache:
        return _company_cache[domain_clean]

    fallback = domain_clean.split(".")[0].replace("-", " ").replace("_", " ").title()

    COMPANY_MODELS = [
        "openai/gpt-oss-20b",
        "qwen/qwen3.8-27b",
        "openai/gpt-oss-120b",
        "llama-3.1-8b-instant",
    ]

    client = Groq(api_key=groq_api_key)
    company_name = None

    for m in COMPANY_MODELS:
        try:
            response = client.chat.completions.create(
                model=m,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a company name resolver. Given a website domain, return the official "
                            "company/organization name. Use your training knowledge first. If the company "
                            "is not well-known, intelligently parse the domain — e.g. 'nisargaits.com' → "
                            "'Nisarga IT Solutions', 'techaheadcorp.com' → 'TechAhead Corp', "
                            "'logicboots.com' → 'LogicBoots'. "
                            "Return ONLY valid JSON: {\"company_name\": \"Name Here\"}. Never return null."
                        )
                    },
                    {
                        "role": "user",
                        "content": f"What is the official company name for the domain: {domain_clean}"
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )

            result = json.loads(response.choices[0].message.content)
            extracted = result.get("company_name", "").strip()
            if extracted and len(extracted) <= 60:
                company_name = extracted
                break
        except Exception as e:
            err_msg = str(e).lower()
            if "model_not_found" in err_msg or "does not exist" in err_msg:
                continue
            print(f"Company name lookup model {m} failed for {domain_clean}: {e}")

    if not company_name:
        company_name = fallback

    _company_cache[domain_clean] = company_name
    return company_name


EMAIL_REGEX = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")

# Pattern: Name <email>
ANGLE_BRACKET_PATTERN = re.compile(
    r"(.+?)\s*<\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\s*>"
)

# Pattern: Name - email
DASH_PATTERN = re.compile(
    r"(.+?)\s*-\s*([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})"
)


def parse_email_list(raw_text):
    """
    Parse a raw text block containing emails in various formats.
    
    Supported formats:
    - One per line
    - Comma-separated
    - Space-separated
    - Name <email>
    - Name - email
    - Mixed formats
    
    Returns a deduplicated list of {"email": str, "name": str|None} dicts.
    """
    if not raw_text or not raw_text.strip():
        return []

    results = []
    seen_emails = set()

    # Split on newlines first to process line by line
    lines = raw_text.strip().split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Try angle bracket pattern: Name <email>
        angle_matches = ANGLE_BRACKET_PATTERN.findall(line)
        if angle_matches:
            for name, email in angle_matches:
                _add_entry(results, seen_emails, email.strip(), name.strip())
            continue

        # Try dash pattern: Name - email
        dash_matches = DASH_PATTERN.findall(line)
        if dash_matches:
            for name, email in dash_matches:
                _add_entry(results, seen_emails, email.strip(), name.strip())
            continue

        # Split on commas and spaces, then extract bare emails
        # Split on commas first
        segments = line.split(",")
        for segment in segments:
            segment = segment.strip()
            if not segment:
                continue

            # Find all emails in this segment
            emails_found = EMAIL_REGEX.findall(segment)
            for email in emails_found:
                _add_entry(results, seen_emails, email, None)

    return results


def _add_entry(results, seen_emails, email, name):
    """Add an email entry if not already seen (case-insensitive dedup)."""
    email_lower = email.lower()
    if email_lower in seen_emails:
        return
    seen_emails.add(email_lower)

    # Clean up the name
    if name:
        name = name.strip().strip('"').strip("'").strip()
        if not name:
            name = None

    results.append({"email": email, "name": name})


# def extract_company_from_email(email):
#     """
#     Extract a company name from an email domain.
#     e.g., john@stripe.com → Stripe
#           hr@big-tech.io  → Big Tech
#     """
#     if not email or "@" not in email:
#         return "the company"

#     domain = email.split("@")[1]
#     # Remove TLD
#     company_part = domain.split(".")[0]
#     # Replace hyphens/underscores with spaces and title-case
#     company_name = company_part.replace("-", " ").replace("_", " ").title()
#     return company_name
