#!/usr/bin/env python3
"""
Simple demonstration of the enhanced email validator functions.
"""

from email_validator import (
    is_valid_email,
    get_email_validation_details,
    normalize_email,
    extract_domain_info,
    suggest_email_correction,
    generate_email_suggestions
)

def main():
    print("Enhanced Email Validator Demo")
    print("=" * 50)

    # Test basic validation
    print("\n1. Basic Email Validation:")
    test_emails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "invalid-email",
        "user@@example.com",
        "a@b.co"
    ]

    for email in test_emails:
        is_valid = is_valid_email(email)
        status = "✓ Valid" if is_valid else "✗ Invalid"
        print(f"  {email:<30} -> {status}")

    # Test detailed validation
    print("\n2. Detailed Validation:")
    email = "test.email@domain.com"
    details = get_email_validation_details(email)
    print(f"  Email: {details['email']}")
    print(f"  Valid: {details['is_valid']}")
    print(f"  Local part: {details['local_part']}")
    print(f"  Domain part: {details['domain_part']}")
    print(f"  Errors: {details['errors']}")

    # Test normalization
    print("\n3. Email Normalization:")
    messy_emails = [
        "  USER@EXAMPLE.COM  ",
        "test.email@DOMAIN.COM",
        " john @ gmail.com "
    ]

    for email in messy_emails:
        normalized = normalize_email(email)
        print(f"  '{email}' -> '{normalized}'")

    # Test domain info
    print("\n4. Domain Information:")
    domain_emails = ["user@gmail.com", "test@10minutemail.com", "admin@company.org"]

    for email in domain_emails:
        info = extract_domain_info(email)
        if 'error' not in info:
            print(f"  {email}:")
            print(f"    - TLD: {info['top_level_domain']}")
            print(f"    - Common provider: {info['is_common_provider']}")
            print(f"    - Disposable: {info['disposable_email']}")
        else:
            print(f"  {email}: {info['error']}")

    # Test email corrections
    print("\n5. Email Corrections:")
    typo_emails = ["user@gamil.com", "test@yahooo.com", "john@hotmial.com", "jane@outlook"]

    for email in typo_emails:
        corrected = suggest_email_correction(email)
        if corrected != email:
            print(f"  '{email}' -> '{corrected}' ✓")
        else:
            print(f"  '{email}' - No correction needed")

    # Test email suggestions
    print("\n6. Email Suggestions:")
    base_email = "johnsmith@example.com"
    suggestions = generate_email_suggestions(base_email, ['separators', 'numbers'])
    print(f"  Base email: {base_email}")
    print("  Suggestions:")
    for i, suggestion in enumerate(suggestions[:5], 1):
        print(f"    {i}. {suggestion}")

    print("\n" + "=" * 50)
    print("Demo completed!")

if __name__ == "__main__":
    main()