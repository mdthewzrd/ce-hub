import re
import unittest
from typing import Union


def is_valid_email(email: str) -> bool:
    """
    Validate email address using regex pattern.

    This function validates email addresses according to RFC 5322 standard with some
    simplifications. It checks for common email format requirements including:
    - Valid local part (before @)
    - Valid domain part (after @)
    - Proper structure and characters

    Args:
        email (str): Email address to validate

    Returns:
        bool: True if email is valid, False otherwise

    Examples:
        >>> is_valid_email("user@example.com")
        True
        >>> is_valid_email("invalid-email")
        False
        >>> is_valid_email("user@sub.domain.com")
        True

    Notes:
        - This regex pattern covers most common email formats
        - It allows letters, numbers, dots, underscores, plus signs, and hyphens in local part
        - Domain must have at least one dot and valid characters
        - Does not support quoted strings or comments as per RFC 5322
        - Local part length limited to 64 characters
        - Total email length limited to 254 characters
    """
    if not isinstance(email, str):
        return False

    # Length validations
    if len(email) > 254:  # RFC 5321 limit
        return False

    # Split email into local and domain parts
    if '@' not in email or email.count('@') != 1:
        return False

    local_part, domain_part = email.rsplit('@', 1)

    # Local part validation
    if len(local_part) > 64:  # RFC 5321 limit
        return False
    if not local_part:  # Cannot be empty
        return False

    # Domain part validation
    if not domain_part or len(domain_part) > 253:
        return False

    # Regex pattern for email validation
    # Local part: alphanumeric + ._%+- (can't start/end with . or have consecutive ..)
    # Domain part: alphanumeric + .- (must end with alphanumeric, subdomains separated by .)
    pattern = r'^[a-zA-Z0-9]([a-zA-Z0-9._%+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$'

    return bool(re.match(pattern, email))


def get_email_validation_details(email: str) -> dict:
    """
    Get detailed validation information for an email address.

    Args:
        email (str): Email address to validate

    Returns:
        dict: Dictionary containing validation results and details
    """
    result = {
        'email': email,
        'is_valid': False,
        'errors': [],
        'local_part': None,
        'domain_part': None,
        'length': len(email) if email else 0
    }

    if not isinstance(email, str):
        result['errors'].append('Email must be a string')
        return result

    if not email:
        result['errors'].append('Email cannot be empty')
        return result

    # Length validation
    if len(email) > 254:
        result['errors'].append('Email exceeds maximum length of 254 characters')

    # Check for @ symbol
    if '@' not in email:
        result['errors'].append('Email must contain @ symbol')
        return result

    if email.count('@') != 1:
        result['errors'].append('Email must contain exactly one @ symbol')
        return result

    # Split email
    local_part, domain_part = email.rsplit('@', 1)
    result['local_part'] = local_part
    result['domain_part'] = domain_part

    # Local part validation
    if not local_part:
        result['errors'].append('Local part (before @) cannot be empty')
    elif len(local_part) > 64:
        result['errors'].append('Local part exceeds maximum length of 64 characters')
    elif local_part.startswith('.'):
        result['errors'].append('Local part cannot start with a dot')
    elif local_part.endswith('.'):
        result['errors'].append('Local part cannot end with a dot')
    elif '..' in local_part:
        result['errors'].append('Local part cannot contain consecutive dots')

    # Domain part validation
    if not domain_part:
        result['errors'].append('Domain part (after @) cannot be empty')
    elif len(domain_part) > 253:
        result['errors'].append('Domain part exceeds maximum length of 253 characters')
    elif '.' not in domain_part:
        result['errors'].append('Domain must contain at least one dot')
    elif domain_part.startswith('.'):
        result['errors'].append('Domain cannot start with a dot')
    elif domain_part.endswith('.'):
        result['errors'].append('Domain cannot end with a dot')
    elif '..' in domain_part:
        result['errors'].append('Domain cannot contain consecutive dots')

    # Check for invalid characters
    local_pattern = r'^[a-zA-Z0-9._%+-]+$'
    domain_pattern = r'^[a-zA-Z0-9.-]+$'

    if local_part and not re.match(local_pattern, local_part):
        result['errors'].append('Local part contains invalid characters')

    if domain_part and not re.match(domain_pattern, domain_part):
        result['errors'].append('Domain part contains invalid characters')

    # Final validation using main function
    result['is_valid'] = is_valid_email(email) and not result['errors']

    return result


class TestEmailValidation(unittest.TestCase):
    """Test cases for email validation functions."""

    def test_valid_emails(self):
        """Test valid email addresses."""
        valid_emails = [
            "user@example.com",
            "test.email@domain.co.uk",
            "user+tag@example.org",
            "user_name@sub.domain.com",
            "u@example.io",
            "test123@example123.com",
            "user-name@example-domain.com",
            "a@b.co",
            "very.common@example.com",
            "disposable.style.email.with+symbol@example.com",
            "other.email-with-dash@example.com",
            "fully-qualified-domain@example.com",
            "user.name+tag+sorting@example.com",
            "x@example.com",
            "example-indeed@strange-example.com",
            "admin@mailserver1",
            "example@s.example"
        ]

        for email in valid_emails:
            with self.subTest(email=email):
                self.assertTrue(is_valid_email(email), f"Email {email} should be valid")

    def test_invalid_emails(self):
        """Test invalid email addresses."""
        invalid_emails = [
            "plainaddress",
            "@missing-local.org",
            "username@.com",
            "username@.com.com",
            ".username@yahoo.com",
            "username@yahoo.com.",
            "username@yahoo..com",
            "username@yahoo.c",
            "username@yahoo.corporate",
            "username@",
            "@",
            "",
            "user@@example.com",
            "user..name@example.com",
            ".user@example.com",
            "user.@example.com",
            "user@example..com",
            "user@example.com.",
            ".user@example.com.",
            "user@example.com..",
            "user name@example.com",
            "user@exam ple.com",
            "user@exa!mple.com",
            "user@example,com",
            "user@exámple.com",
            "user@-example.com",
            "user@example-.com",
            "user@example.com-",
            "user" * 20 + "@example.com",  # Local part too long
            "user@" + "domain" * 50 + ".com",  # Domain too long
        ]

        for email in invalid_emails:
            with self.subTest(email=email):
                self.assertFalse(is_valid_email(email), f"Email {email} should be invalid")

    def test_edge_cases(self):
        """Test edge cases and boundary conditions."""
        # Test non-string input
        self.assertFalse(is_valid_email(None))
        self.assertFalse(is_valid_email(123))
        self.assertFalse(is_valid_email([]))

        # Test empty string
        self.assertFalse(is_valid_email(""))

        # Test single character email
        self.assertTrue(is_valid_email("a@b.co"))

        # Test maximum length email (254 characters)
        long_local = "a" * 64
        long_domain = "a" * 63 + "." + "a" * 63 + "." + "a" * 63 + ".com"
        self.assertTrue(is_valid_email(f"{long_local}@{long_domain[:190]}"))

    def test_validation_details(self):
        """Test detailed validation function."""
        # Test valid email
        result = get_email_validation_details("user@example.com")
        self.assertTrue(result['is_valid'])
        self.assertEqual(result['local_part'], "user")
        self.assertEqual(result['domain_part'], "example.com")
        self.assertEqual(len(result['errors']), 0)

        # Test invalid email
        result = get_email_validation_details("invalid-email")
        self.assertFalse(result['is_valid'])
        self.assertIn('Email must contain @ symbol', result['errors'])

        # Test empty email
        result = get_email_validation_details("")
        self.assertFalse(result['is_valid'])
        self.assertIn('Email cannot be empty', result['errors'])


def validate_multiple_emails(emails: list[str]) -> dict[str, dict]:
    """
    Validate multiple email addresses and return detailed results.

    Args:
        emails: List of email addresses to validate

    Returns:
        Dictionary mapping each email to its validation details
    """
    results = {}
    for email in emails:
        results[email] = get_email_validation_details(email)
    return results


def normalize_email(email: str) -> str:
    """
    Normalize email address for consistent comparison.

    Args:
        email: Email address to normalize

    Returns:
        Normalized email address
    """
    if not isinstance(email, str):
        return ""

    # Convert to lowercase and trim whitespace
    normalized = email.strip().lower()

    # Remove any extra spaces around @
    if '@' in normalized:
        local, domain = normalized.split('@', 1)
        normalized = f"{local.strip()}@{domain.strip()}"

    return normalized


def extract_domain_info(email: str) -> dict:
    """
    Extract detailed information about the email domain.

    Args:
        email: Email address to analyze

    Returns:
        Dictionary with domain information
    """
    if not is_valid_email(email):
        return {'error': 'Invalid email address'}

    local_part, domain_part = email.rsplit('@', 1)

    info = {
        'full_domain': domain_part,
        'subdomains': domain_part.split('.'),
        'top_level_domain': domain_part.split('.')[-1],
        'domain_length': len(domain_part),
        'is_common_provider': False,
        'disposable_email': False
    }

    # Check for common email providers
    common_providers = {
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
        'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
    }

    if domain_part.lower() in common_providers:
        info['is_common_provider'] = True

    # Check for common disposable email patterns
    disposable_patterns = [
        '10minutemail', 'tempmail', 'guerrillamail', 'mailinator',
        'throwaway', 'temp', 'disposable', 'fakemail'
    ]

    if any(pattern in domain_part.lower() for pattern in disposable_patterns):
        info['disposable_email'] = True

    return info


def suggest_email_correction(email: str) -> str:
    """
    Suggest correction for common email typos.

    Args:
        email: Email address with potential typos

    Returns:
        Suggested corrected email (or original if no correction needed)
    """
    if not isinstance(email) or '@' not in email:
        return email

    local_part, domain_part = email.rsplit('@', 1)

    # Common domain typos and corrections
    domain_corrections = {
        'gamil.com': 'gmail.com',
        'gmial.com': 'gmail.com',
        'gmaill.com': 'gmail.com',
        'gmail.co': 'gmail.com',
        'gmailcom': 'gmail.com',
        'yahooo.com': 'yahoo.com',
        'yaho.com': 'yahoo.com',
        'hotmial.com': 'hotmail.com',
        'hotmai.com': 'hotmail.com',
        'outlook.co': 'outlook.com',
        'outlookcom': 'outlook.com',
        'goggle.com': 'gmail.com',
        'gnail.com': 'gmail.com'
    }

    # Check for domain corrections
    corrected_domain = domain_corrections.get(domain_part.lower())
    if corrected_domain:
        return f"{local_part}@{corrected_domain}"

    # Check for missing .com
    if not '.' in domain_part and len(domain_part) > 1:
        common_domains = ['gmail', 'yahoo', 'hotmail', 'outlook', 'aol']
        if domain_part.lower() in common_domains:
            return f"{local_part}@{domain_part.lower()}.com"

    return email


def generate_email_suggestions(base_email: str, variations: list = None) -> list:
    """
    Generate alternative email suggestions based on a base email.

    Args:
        base_email: Base email address
        variations: List of variation types to generate

    Returns:
        List of suggested email variations
    """
    if not is_valid_email(base_email):
        return []

    if variations is None:
        variations = ['separators', 'numbers', 'initials']

    local_part, domain_part = base_email.rsplit('@', 1)
    suggestions = set()

    # Remove existing separators and numbers
    clean_local = re.sub(r'[._+-]', '', local_part)
    clean_local = re.sub(r'\d+', '', clean_local)

    if 'separators' in variations:
        # Add different separators
        suggestions.add(f"{clean_local}@{domain_part}")
        suggestions.add(f"{clean_local}.{clean_local}@{domain_part}")
        suggestions.add(f"{clean_local}_{clean_local}@{domain_part}")
        suggestions.add(f"{clean_local}-{clean_local}@{domain_part}")

    if 'numbers' in variations:
        # Add common number variations
        for num in ['1', '2', '123', '2023', '2024']:
            suggestions.add(f"{clean_local}{num}@{domain_part}")
            suggestions.add(f"{clean_local}.{num}@{domain_part}")

    if 'initials' in variations and len(clean_local) > 3:
        # Add initial variations
        first_initial = clean_local[0]
        last_initial = clean_local[-1]
        suggestions.add(f"{first_initial}{clean_local[1:]}@{domain_part}")
        suggestions.add(f"{clean_local[:-1]}{last_initial}@{domain_part}")
        suggestions.add(f"{first_initial}{clean_local[1:-1]}{last_initial}@{domain_part}")

    # Filter out original email and invalid suggestions
    return [email for email in suggestions
            if email != base_email and is_valid_email(email)][:10]


def main():
    """Run test cases and demonstrate usage."""
    print("Email Validation Function")
    print("=" * 50)

    # Demo emails
    demo_emails = [
        "user@example.com",
        "invalid-email",
        "test.email@domain.co.uk",
        "user@@example.com",
        "a@b.co",
        ""
    ]

    print("\nDemonstration:")
    for email in demo_emails:
        is_valid = is_valid_email(email)
        print(f"Email: '{email:30}' -> {'Valid' if is_valid else 'Invalid'}")

    # Show detailed validation for one email
    print("\nDetailed validation example:")
    result = get_email_validation_details("test.email@domain.com")
    print(f"Email: {result['email']}")
    print(f"Valid: {result['is_valid']}")
    print(f"Local part: {result['local_part']}")
    print(f"Domain part: {result['domain_part']}")
    print(f"Errors: {result['errors']}")

    # Demo batch validation
    print("\nBatch validation example:")
    test_batch = ["user@example.com", "invalid", "test@test.org", "a@b.co"]
    batch_results = validate_multiple_emails(test_batch)
    for email, details in batch_results.items():
        status = "✓" if details['is_valid'] else "✗"
        print(f"{status} {email:<25} - {'Valid' if details['is_valid'] else 'Invalid'}")

    # Demo new functions
    print("\nNew Features Demo:")
    print("=" * 50)

    # Email normalization
    print("\nEmail Normalization:")
    messy_emails = ["  USER@EXAMPLE.COM  ", "test.email@DOMAIN.COM", " john @ gmail.com "]
    for email in messy_emails:
        normalized = normalize_email(email)
        print(f"'{email}' -> '{normalized}'")

    # Domain information
    print("\nDomain Information:")
    domain_emails = ["user@gmail.com", "test@10minutemail.com", "admin@company.org"]
    for email in domain_emails:
        info = extract_domain_info(email)
        if 'error' not in info:
            print(f"{email}:")
            print(f"  - TLD: {info['top_level_domain']}")
            print(f"  - Common provider: {info['is_common_provider']}")
            print(f"  - Disposable: {info['disposable_email']}")
        else:
            print(f"{email}: {info['error']}")

    # Email corrections
    print("\nEmail Corrections:")
    typo_emails = ["user@gamil.com", "test@yahooo.com", "john@hotmial.com", "jane@outlook"]
    for email in typo_emails:
        corrected = suggest_email_correction(email)
        if corrected != email:
            print(f"'{email}' -> '{corrected}' ✓")
        else:
            print(f"'{email}' - No correction needed")

    # Email suggestions
    print("\nEmail Suggestions:")
    base_email = "johnsmith@example.com"
    suggestions = generate_email_suggestions(base_email, ['separators', 'numbers'])
    print(f"Base email: {base_email}")
    print("Suggestions:")
    for i, suggestion in enumerate(suggestions[:5], 1):
        print(f"  {i}. {suggestion}")

    # Run unit tests
    print("\n" + "=" * 50)
    print("Running Unit Tests:")
    print("=" * 50)
    unittest.main(argv=[''], exit=False, verbosity=2)


if __name__ == "__main__":
    main()