"""
AI Caption Generation Service
Integrates with OpenRouter API using vision-enhanced models
Generates captions using actual video content analysis + brand voice
"""

import os
import sys
import json
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime
import sqlite3
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import vision-based video analyzer
try:
    from video_analyzer import analyze_video_with_vision
    VISION_AVAILABLE = True
    print("[AI Service] Vision video analyzer available")
except ImportError as e:
    VISION_AVAILABLE = False
    print(f"[AI Service] Vision analyzer not available: {e}")

# Import agent health and RAG systems
try:
    from agent_health_system import get_metrics_tracker, get_archon, get_benchmarker
    from rag_caption_learner import get_rag_system, get_knowledge_base
    HEALTH_SYSTEMS_AVAILABLE = True
    print("[AI Service] Agent health and RAG systems available")
except ImportError as e:
    HEALTH_SYSTEMS_AVAILABLE = False
    print(f"[AI Service] Health systems not available: {e}")

# Add parent directory to path to import database module


def add_emojis_if_needed(caption: str) -> str:
    """
    Post-process caption to ensure MINIMAL, strategic emoji usage

    Guidelines:
    - Max 5-10% of lines should have emojis
    - 1-2 emojis total MAX for entire caption
    - NO emoji in the hook/first line (keep it clean)
    - Only add to: ONE key body point, or CTA
    """
    # First, strip ALL emojis from the first line/hook
    caption = remove_emojis_from_first_line(caption)

    # Count existing emojis
    emoji_count = sum(1 for c in caption if ord(c) > 127000)
    lines = caption.split('\n')
    non_empty_lines = [l for l in lines if l.strip()]

    # Calculate desired emoji count (5-10% of lines, max 2)
    desired_count = min(2, max(1, int(len(non_empty_lines) * 0.075)))

    # If already has good emoji count, return as-is
    if emoji_count >= desired_count:
        # Remove excess emojis if too many
        if emoji_count > desired_count:
            return _reduce_emojis(caption, desired_count)
        return caption

    # Add minimal emojis strategically - NEVER to hook/first line
    result_lines = []
    emojis_added = 0
    body_emoji = ['💡', '✓', '→']
    cta_emoji = ['👇', '↓']

    for i, line in enumerate(lines):
        if not line.strip():
            result_lines.append(line)
            continue

        # SKIP the hook/first line - NO emoji there
        if i == 0:
            result_lines.append(line)
            continue

        # Add emoji to ONE key body paragraph (middle of caption)
        elif line.strip() and emojis_added == 0 and len(line) > 40 and i > 2 and i < len(lines) - 3:
            line = line + ' ' + body_emoji[0]
            emoji_count += 1
            emojis_added += 1

        result_lines.append(line)

    # Add emoji to CTA if needed (last non-empty line) - but ONLY if caption has 5+ lines
    # This avoids placing emoji right after the hook in short captions
    if emojis_added < desired_count and len(result_lines) >= 5:
        for i in range(len(result_lines) - 1, -1, -1):
            if result_lines[i].strip() and emojis_added < desired_count:
                # Make sure this isn't the hook (first non-empty line)
                if i > 2:  # Only add to lines after the first few (hook + early content)
                    result_lines[i] = result_lines[i] + ' ' + cta_emoji[0]
                    emojis_added += 1
                    break

    return '\n'.join(result_lines)


def remove_emojis_from_first_line(caption: str) -> str:
    """
    Remove ALL emojis from the first line/hook of the caption.
    Instagram hooks should be clean text without emojis.
    """
    import re

    lines = caption.split('\n')
    if not lines:
        return caption

    # Get the first non-empty line (the hook)
    first_line_idx = 0
    for i, line in enumerate(lines):
        if line.strip():
            first_line_idx = i
            break

    # Remove emojis from the first line
    first_line = lines[first_line_idx]

    # Common emoji ranges and patterns
    emoji_ranges = [
        (0x1F600, 0x1F64F),  # Emoticons
        (0x1F300, 0x1F5FF),  # Symbols & Pictographs
        (0x1F680, 0x1F6FF),  # Transport & Map
        (0x1F1E0, 0x1F1FF),  # Flags
        (0x2600, 0x26FF),    # Misc symbols
        (0x2700, 0x27BF),    # Dingbats
        (0xFE00, 0xFE0F),    # Variation Selectors
        (0x1F900, 0x1F9FF),  # Supplemental Symbols
        (0x1FA00, 0x1FA6F),  # Symbols and Pictographs Extended-A
        (0x1FA70, 0x1FAFF),  # Symbols and Pictographs Extended-B
        (0x231A, 0x23FF),    # Miscellaneous Technical
        (0x2B50, 0x2B55),    # Stars
    ]

    # Remove emojis
    cleaned_line = ''
    for char in first_line:
        char_code = ord(char)
        is_emoji = any(start <= char_code <= end for start, end in emoji_ranges)
        # Also check for common arrow emojis and similar
        if not is_emoji and char_code not in [0x27A1, 0x2B05, 0x2B06, 0x2B07, 0x25C0, 0x25B6, 0x23EC, 0x23EA]:
            cleaned_line += char

    # Clean up any trailing spaces after removing emoji
    cleaned_line = cleaned_line.rstrip()

    # Also remove emoji-like text patterns (e.g., "👇" as text)
    cleaned_line = re.sub(r'\s*[→👇↓⬇️📲]\s*$', '', cleaned_line)

    lines[first_line_idx] = cleaned_line
    return '\n'.join(lines)


def enforce_hook_length_limit(caption: str, max_chars: int = 140) -> str:
    """
    Enforce strict character limit for the first 2 lines (mobile preview).

    Instagram shows first 2 lines before "more" button on mobile.
    This ensures the hook is fully visible without clicking.

    Args:
        caption: The full caption text
        max_chars: Maximum characters for first 2 lines combined (default: 140)

    Returns:
        Caption with truncated/shortened hook if needed
    """
    lines = caption.split('\n')

    # Get first 2 non-empty lines (the mobile preview)
    preview_lines = []
    preview_length = 0
    first_line_idx = -1
    second_line_idx = -1

    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped:
            if first_line_idx == -1:
                first_line_idx = i
                preview_lines.append(stripped)
                preview_length += len(stripped)
            elif second_line_idx == -1:
                second_line_idx = i
                preview_lines.append(stripped)
                preview_length += len(stripped)
                break

    # If preview is within limit, return as-is
    if preview_length <= max_chars:
        return caption

    # Need to shorten the hook
    first_line = lines[first_line_idx] if first_line_idx >= 0 else ""

    # Strategy: Truncate first line to fit, ending with natural break
    # Try to end at a complete word or phrase

    # If first line alone exceeds limit, truncate it
    if len(first_line) > max_chars:
        # Find a good truncation point (ellipsis, question mark, or word boundary)
        truncation_points = ['...', '?', '!', '.', ' -', ',']
        best_truncate = max_chars - 10  # Leave room for "..." if needed

        for i, point in enumerate(truncation_points):
            idx = first_line.rfind(point, 0, best_truncate)
            if idx > 10:  # Found a good break point
                first_line = first_line[:idx + len(point)].rstrip()
                break
        else:
            # No good break point, truncate at word boundary
            words = first_line[:best_truncate].split()
            first_line = ' '.join(words[:-1]) + '...'

        lines[first_line_idx] = first_line

        # Remove second line if it exists (hook should be single line now)
        if second_line_idx >= 0 and second_line_idx > first_line_idx:
            # Check if second line content should be kept
            second_line = lines[second_line_idx].strip()
            if len(first_line) + len(second_line) > max_chars:
                # Remove second line, but keep rest of caption
                lines.pop(second_line_idx)

    return '\n'.join(lines)


def _reduce_emojis(caption: str, max_count: int) -> str:
    """Remove excess emojis to keep it clean"""
    lines = caption.split('\n')
    result_lines = []
    emoji_count = 0

    for line in lines:
        # Count emojis in this line
        line_emojis = sum(1 for c in line if ord(c) > 127000)

        # If adding this line would exceed max, strip emojis from it
        if emoji_count + line_emojis > max_count and line_emojis > 0:
            # Remove emojis from this line
            clean_line = ''.join(c for c in line if ord(c) < 127000)
            result_lines.append(clean_line.rstrip())
        else:
            emoji_count += line_emojis
            result_lines.append(line)

    return '\n'.join(result_lines)


def improve_caption_spacing(caption: str) -> str:
    """
    Improve caption spacing for better Instagram readability

    Ensures proper paragraph breaks and visual rhythm
    """
    lines = caption.split('\n')
    formatted_lines = []
    prev_was_content = False

    for line in lines:
        stripped = line.strip()
        is_empty = not stripped

        if not is_empty:
            # If we have 2+ consecutive content lines, add a break between them
            if prev_was_content:
                # Check if previous line was substantial enough to need a break
                if len(formatted_lines) > 0 and len(formatted_lines[-1]) > 40:
                    formatted_lines.append("")  # Add empty line for paragraph break
                formatted_lines.append(stripped)
            else:
                formatted_lines.append(stripped)
            prev_was_content = True
        else:
            # Skip multiple consecutive empty lines
            if not formatted_lines or formatted_lines[-1] != "":
                formatted_lines.append("")
            prev_was_content = False

    # Clean up any trailing empty lines
    while formatted_lines and formatted_lines[-1] == "":
        formatted_lines.pop()

    return '\n'.join(formatted_lines)


def remove_markdown_formatting(caption: str) -> str:
    """
    Remove all markdown formatting that Instagram doesn't support.
    Removes: **bold**, *italic*, __underline__, `code`, ## headers, etc.
    """
    import re

    # Remove bold markdown (**text** or __text__)
    caption = re.sub(r'\*\*([^*]+)\*\*', r'\1', caption)  # **bold**
    caption = re.sub(r'__([^_]+)__', r'\1', caption)  # __bold__

    # Remove italic markdown (*text* or _text_)
    caption = re.sub(r'\*([^*]+)\*', r'\1', caption)  # *italic*
    caption = re.sub(r'_([^_]+)_', r'\1', caption)  # _italic_

    # Remove strikethrough (~~text~~)
    caption = re.sub(r'~~([^~]+)~~', r'\1', caption)

    # Remove inline code (`text`)
    caption = re.sub(r'`([^`]+)`', r'\1', caption)

    # Remove markdown headers (## or ### at start of line)
    lines = caption.split('\n')
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Remove markdown headers at start of line
        if stripped.startswith('###'):
            cleaned_lines.append(stripped[3:].strip())
        elif stripped.startswith('##'):
            cleaned_lines.append(stripped[2:].strip())
        elif stripped.startswith('#'):
            cleaned_lines.append(stripped[1:].strip())
        else:
            cleaned_lines.append(line)

    return '\n'.join(cleaned_lines)


def remove_quote_wrapping(caption: str) -> str:
    """
    Remove quote wrapping around the entire caption or first line.
    Sometimes AI wraps the whole caption in quotes: "caption here"
    Or just the first line: "The world's most ancient engineers..."
    """
    caption = caption.strip()

    # First, handle the case where the entire caption is quoted
    quote_chars = ['"', "'"]

    for quote in quote_chars:
        # Check if entire caption is wrapped in this quote type
        if len(caption) >= 2 and caption.startswith(quote) and caption.endswith(quote):
            # Check if there's a matching quote at the end
            quote_count = caption.count(quote)
            # Only unwrap if it looks like the whole thing is quoted (start+end match, and minimal internal quotes)
            if quote_count == 2:
                caption = caption[1:-1].strip()
                break
            elif caption.startswith(quote) and caption.endswith(quote) and f'{quote}\n' not in caption:
                # If quotes are at very start and end with no newlines with quotes, unwrap
                caption = caption[1:-1].strip()
                break

    # Second, handle the case where only the first line is quoted
    lines = caption.split('\n')
    if lines:
        first_line = lines[0].strip()
        # Check if first line starts and ends with quotes
        for quote in quote_chars:
            if len(first_line) >= 2 and first_line.startswith(quote) and first_line.endswith(quote):
                # Remove quotes from first line
                lines[0] = first_line[1:-1].strip()
                break

    return '\n'.join(lines)


def remove_ai_meta_commentary(caption: str) -> str:
    """
    Remove AI-generated meta-commentary and prefixes.
    Examples:
    - "Here's a production-ready Instagram caption:"
    - "Here is your caption:"
    - "**The Secret Code in Stone**"
    - etc.
    """
    import re
    lines = caption.split('\n')
    filtered_lines = []

    # Expanded patterns - include contractions and variations
    meta_patterns = [
        r'^Here is the (revised|rewritten|production-ready|optimized|fresh|new|scroll-stopping|unique|powerful) (Instagram )?caption:?',  # Various prefixes (with optional colon)
        r"^Here('s| is a) (production-ready|optimized|fresh|new|scroll-stopping|compelling|unique) (Instagram )?caption(: | that |:).*$",  # Contractions (catching longer variations)
        r'^Here is your (caption|Instagram caption):?',  # Direct assignment (with optional colon)
        r"^Here('s| is) your (caption|Instagram caption):?",  # With contractions (with optional colon)
        r"^Here('s| is) an? (Instagram )?caption",  # Various "Here's a/Here's an" patterns
        r'^(Below is the|The following is a) caption',  # Alternative intros
        r'^Caption:?$',  # Just "Caption:" or "Caption"
        r'^Your caption:?$',  # "Your caption:"
        r'^Generated caption:?$',  # "Generated caption:"
        r'^Here is a (fresh|unique|powerful)',  # Catch "Here is a fresh..."
        r"^Here('s| is) a (fresh|unique|powerful)",  # Catch "Here's a fresh..."
        r'^Here is an? (Instagram )?caption with',  # Catch "Here is a caption with..."
        r"^Here('s| is) an? (Instagram )?caption with",  # Catch "Here's a caption with..."
        r'^Your (fresh|unique|powerful) caption',  # More variations
        r"^Here('s| is) a (fresh|unique|powerful) caption with",  # Specific: "Here's a fresh caption with..."
        r"^Here's a (rewritten|production-ready|scroll-stopping) (Instagram )?caption(: | that |:).*$",  # Catch "Here's a rewritten caption that..."
        r"^Here is a (rewritten|production-ready|scroll-stopping) (Instagram )?caption(: | that |:).*$",  # Catch "Here is a rewritten caption that..."
    ]

    # Section headers and meta-labels (case insensitive)
    section_patterns = [
        r'^\*\*.*\*\*$',  # **ANYTHING IN BOLD** (likely a header)
        r'^CHAPTER\s+\d+.*$',
        r'^CHAPTER\s+[IVX]+.*$',
        r'^##\s+.*$',
        r'^###\s+.*$',
        r'^\d+\.\s+.*$',  # "1. ", "2. " etc
        r'^PRACTICAL\s+APPLICATION.*$',
        r'^POWERFUL\s+CONCLUSION.*$',
        r'^THE\s+WINNING\s+FORMULA.*$',
        r'^BRAND\s+VOICE.*$',
        r'^TONE\s+GUIDELINES.*$',
        r'^CRITICAL\s+REQUIREMENTS.*$',
        r'^CONTENT\s+SAFETY.*$',
        r'^REFERENCE\s+.*$',
        r'^Part\s+\d+\s+of\s+\d+.*$',  # Part labels
        r'^The\s+Transformation.*$',
        r'^A\s+New\s+Reality.*$',
        r'^Practical\s+Application.*$',
        r'^The\s+Solution.*$',
        r'^The\s+Reveal.*$',
        r'^The\s+Truth.*$',
        r'^Conclusion.*$',
        r'^The Secret.*$',  # Common AI-generated section headers
        r'^.*Code in Stone.*$',  # Specific example from test
    ]

    # Combine all patterns
    all_patterns = meta_patterns + section_patterns
    combined_pattern = '|'.join(f'({p})' for p in all_patterns)
    regex = re.compile(combined_pattern, re.IGNORECASE)

    for line in lines:
        stripped = line.strip()

        # Skip lines that match any meta/header pattern
        if regex.match(stripped):
            continue

        # Skip all-caps lines that look like headers (short, all caps with colon)
        if stripped and len(stripped) < 60 and stripped.isupper() and (':' in stripped or stripped.endswith('.')):
            continue

        # Skip title case lines that look like section headers
        if stripped and len(stripped) < 50 and ':' not in stripped and '.' not in stripped:
            words = stripped.split()
            if len(words) >= 2 and len(words) <= 6:
                title_case_count = sum(1 for w in words if w and w[0].isupper())
                if title_case_count == len(words):
                    continue  # Skip this line, looks like a section header

        filtered_lines.append(line)

    # Clean up excessive blank lines
    result_lines = []
    prev_empty = False
    for line in filtered_lines:
        is_empty = not line.strip()
        if is_empty:
            if not prev_empty:
                result_lines.append(line)
            prev_empty = True
        else:
            # Strip leading/trailing whitespace from each non-empty line
            result_lines.append(line.strip())
            prev_empty = False

    result = '\n'.join(result_lines).strip()
    return result


def remove_chapter_labels_and_headers(caption: str) -> str:
    """
    Remove chapter labels, section headers, and other non-Instagram formatting.
    DEPRECATED: Use remove_ai_meta_commentary instead.
    This function now wraps the newer functions for backwards compatibility.
    """
    # First remove markdown
    caption = remove_markdown_formatting(caption)
    # Then remove AI meta-commentary
    caption = remove_ai_meta_commentary(caption)
    # Finally remove quote wrapping
    caption = remove_quote_wrapping(caption)
    return caption


def filter_shadowban_triggers(caption: str) -> str:
    """
    Filter out phrases that trigger shadowbans or content moderation
    Focus on medical claims, conspiracy language, and platform-risky content
    """
    import re

    # Phrases to soften or remove
    replacements = {
        # Medical cure claims - soften to language about wellness
        r'cured cancer': 'supported wellness',
        r'cure[sd]?\s+cancer': 'helped with wellness',
        r'cure[sd]?\s+': 'helped with ',
        r'cancer.*disappeared': 'health improved',
        r'pathogens.*destroyed': 'pathogens managed',

        # Conspiracy/suppression language - soften to education angle
        r'systematically suppressed': 'overlooked',
        r'has been suppressed': 'has been overlooked',
        r'buried.*truth': 'not widely discussed',
        r'hidden.*truth': 'lesser-known',
        r'disappeared': 'was forgotten',
        r'documented.*then.*buried': 'documented but not widely shared',

        # Anti-medicine/authority framing
        r'rely on external authority': 'consider all perspectives',
        r'external authority.*fix': 'outside solutions',
        r'outsourcing.*body': 'looking beyond yourself',

        # Absolute claims - soften to possibility language
        r'isn\'t a fantasy': 'is worth exploring',
        r'not.*fantasy': 'worth considering',
        r'This isn\'t [a-z]+ fantasy': 'This is worth exploring',
        r'It\'s a reality': 'It\'s a possibility worth considering',
        r'hidden in plain sight': 'often overlooked',
    }

    result = caption
    for pattern, replacement in replacements.items():
        result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

    return result


def format_for_mobile_readability(caption: str) -> str:
    """
    Format caption for optimal mobile Instagram readability

    Key principles:
    - Break long paragraphs into shorter chunks (2-3 sentences max)
    - Add visual breathing room between ideas
    - Make it scannable while scrolling
    - Keep the hook compact (2 lines max)
    """
    lines = caption.split('\n')
    formatted = []
    in_hook = True

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if formatted and formatted[-1] != "":
                formatted.append("")
            in_hook = False
            continue

        # Hook (first non-empty line) - keep compact
        if in_hook:
            formatted.append(stripped)
            in_hook = False
            continue

        # Long paragraphs need breaking up
        # Count sentences roughly
        sentence_count = stripped.count('.') + stripped.count('!') + stripped.count('?')

        if sentence_count >= 4 or len(stripped) > 200:
            # Break this paragraph into smaller chunks
            chunks = split_long_paragraph(stripped)
            for i, chunk in enumerate(chunks):
                if i > 0:
                    formatted.append("")
                formatted.append(chunk.strip())
        else:
            formatted.append(stripped)

    # Clean up excessive blank lines
    result = []
    prev_empty = False
    for line in formatted:
        if not line.strip():
            if not prev_empty:
                result.append("")
            prev_empty = True
        else:
            result.append(line)
            prev_empty = False

    # Trim trailing empty lines
    while result and not result[-1].strip():
        result.pop()

    return '\n'.join(result)


def split_long_paragraph(paragraph: str) -> list:
    """
    Split a long paragraph into 2-3 sentence chunks for mobile readability
    """
    import re

    # Split by sentence endings
    sentences = re.split(r'(?<=[.!?])\s+', paragraph)

    chunks = []
    current_chunk = []

    for sentence in sentences:
        current_chunk.append(sentence)
        sentence_count = len(current_chunk)

        # Start a new chunk after 2-3 sentences
        if sentence_count >= 2 and len(' '.join(current_chunk)) > 120:
            chunks.append(' '.join(current_chunk))
            current_chunk = []
        elif sentence_count >= 3:
            chunks.append(' '.join(current_chunk))
            current_chunk = []

    # Add remaining sentences
    if current_chunk:
        chunks.append(' '.join(current_chunk))

    return chunks

sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))
from database import get_brand_voice_for_caption_by_id

# Database path - resolve to handle .. in paths correctly
DB_PATH = Path(__file__).resolve().parent.parent.parent / "harmonatica.db"


class OpenRouterClient:
    """Client for OpenRouter API - Fast caption generation with fallback support"""

    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        # Primary model from env
        self.model = os.getenv("OPENROUTER_MODEL", "google/gemma-3-27b-it:free")
        # Fallback models for rate limiting
        self.fallback_models = [
            os.getenv("OPENROUTER_BACKUP_MODEL_1", "meta-llama/llama-3.3-70b-instruct:free"),
            os.getenv("OPENROUTER_BACKUP_MODEL_2", "mistralai/mistral-small-3.1-24b-instruct:free"),
        ]
        print(f"[OpenRouter] Using model: {self.model}")
        print(f"[OpenRouter] Fallback models: {self.fallback_models}")

    def generate_completion(self, messages: List[Dict], **kwargs) -> Dict:
        """Generate completion from OpenRouter API with fallback support"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://harmonatica.app",
            "X-Title": "Harmonatica AI Caption Maker"
        }

        # Try primary model first, then fallbacks
        models_to_try = [self.model] + self.fallback_models

        for attempt, model in enumerate(models_to_try):
            payload = {
                "model": model,
                "messages": messages,
                "temperature": kwargs.get("temperature", 0.7),
                "max_tokens": kwargs.get("max_tokens", 1000),
                "top_p": kwargs.get("top_p", 0.9),
            }

            # Add reasoning mode if specified
            if kwargs.get("reasoning", False):
                payload["reasoning"] = {"enabled": True}

            try:
                print(f"[OpenRouter] Attempt {attempt + 1}/{len(models_to_try)}: {model}...")
                response = requests.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30
                )

                # Check for rate limit errors
                if response.status_code == 429:
                    print(f"[OpenRouter] Rate limited on {model}, trying fallback...")
                    continue

                response.raise_for_status()
                result = response.json()

                # Track which model succeeded
                if attempt > 0:
                    print(f"[OpenRouter] Fallback model {model} succeeded!")

                # Add model info to result
                result["model_used"] = model
                result["fallback_used"] = attempt > 0
                print(f"[OpenRouter] Request successful with {model}")
                return result

            except requests.exceptions.Timeout:
                print(f"[OpenRouter] Request timed out on {model}, trying fallback...")
                continue
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 429:
                    print(f"[OpenRouter] Rate limited on {model}, trying fallback...")
                    continue
                print(f"[OpenRouter] HTTP error on {model}: {e}")
                if attempt < len(models_to_try) - 1:
                    continue
                return {"error": f"All models failed. Last error: {e}"}
            except Exception as e:
                print(f"[OpenRouter] API error on {model}: {e}")
                if attempt < len(models_to_try) - 1:
                    continue
                return {"error": f"All models failed. Last error: {e}"}

        return {"error": "All models failed"}


class CaptionPromptBuilder:
    """Builds optimized prompts for caption generation"""

    @staticmethod
    def build_caption_generation_prompt(
        video_analysis: Dict,
        reference_captions: List[Dict],
        account_info: Dict,
        manychat_cta: str,
        use_manychat_cta: bool = True,
        caption_style: str = "long_form",
        caption_length_preference: str = "medium"
    ) -> List[Dict]:
        """
        Build prompt for generating long-form, watchtime-optimized captions

        Args:
            video_analysis: AI analysis of video content
            reference_captions: Top performing captions for context
            account_info: Account brand voice and configuration
            manychat_cta: ManyChat CTA to include
            use_manychat_cta: Whether to include ManyChat CTA in the prompt
            caption_style: long_form, short_story, or short_engagement
        """

        # Extract key elements from video analysis
        content_type = video_analysis.get("content_type", "")
        vibe = video_analysis.get("vibe", "")
        key_elements = video_analysis.get("key_elements", [])
        visual_description = video_analysis.get("visual_description", "")

        # Build reference context from top captions
        reference_context = CaptionPromptBuilder._build_reference_context(
            reference_captions, top_k=3
        )

        # Build brand voice context
        brand_voice = account_info.get("brand_voice", "")
        tone_guidelines = account_info.get("tone_guidelines", "")

        # Build ManyChat CTA sections if enabled
        manychat_sections = ""
        if use_manychat_cta:
            manychat_sections = f"""

1. **MANYCHAT CTA** (top): Comment "{manychat_cta}" to get the full breakdown/guide/freebie

5. **MANYCHAT CTA** (bottom): Specific, benefit-driven action
   - "Comment '{manychat_cta}' and I'll send you [specific benefit]"
   - Make it clear WHAT they get and WHY they want it
   - Connect to the value you just demonstrated in the caption"""

        # Build structure section
        if use_manychat_cta:
            structure_section = """
## The Winning Formula (Optimized for Mobile Scrolling):"""
        else:
            structure_section = """
## The Winning Formula (Optimized for Mobile Scrolling):

1. **DISRUPTIVE HOOK** - 2 LINES MAX for mobile screens
   - Create immediate curiosity in first 2 lines (before "more" button)
   - Use conversational, relatable language - NOT marketing speak
   - Pattern interrupt: "Most people get this wrong..." or "Here's what nobody tells you..."
   - Make it feel like you're sharing a secret, not selling something

2. **THE REVEAL** - Expand with substance and depth
   - 3-5 substantial paragraphs that actually teach something
   - Each paragraph should be 2-4 sentences long with real explanation
   - Share the backstory, the "why", and the practical application
   - Use conversational tone like you're talking to a friend
   - Include specific examples, numbers, or references when possible
   - Build the case gradually - don't rush to the solution

3. **THE SOLUTION** - Your content as the answer
   - Frame it as the natural conclusion to the problem you identified
   - Show what's possible when they understand this
   - Make them feel empowered, not sold to
   - Use phrases like "here's what actually works" or "this changed everything for me"

4. **NATURAL ENDING** - No hard CTA
   - End with an empowering thought or open question
   - Let the content stand on its own
   - Focus on value delivered, not asking for something"""

        # Caption length specifications (Instagram optimized)
        length_specs = {
            "story": "300-400 words - A flowing narrative that tells a complete story with 3-4 substantial paragraphs. Keep it engaging but scannable.",
            "long": "250-350 words - Detailed exploration with 3-4 paragraphs and solid teaching.",
            "medium": "180-250 words - Balanced approach with key insights and 2-3 paragraphs.",
            "short": "80-120 words - Quick, punchy delivery of one core idea."
        }
        length_instruction = length_specs.get(caption_length_preference, length_specs["medium"])

        # Main system prompt
        system_prompt = f"""You are a world-class Instagram copywriter specializing in {caption_style} captions that maximize watch time and engagement.

## Your Mission
Generate a captivating, long-form caption that stops the scroll, pulls readers through a story{', and naturally leads to a call-to-action' if use_manychat_cta else ''}.{manychat_sections}

{structure_section}

## Brand Voice:
{brand_voice}

{f"## Tone Guidelines:\n{tone_guidelines}" if tone_guidelines else ""}

## Video Content You're Writing For:
- Content Type: {content_type}
- Vibe: {vibe}
- Key Elements: {', '.join(key_elements) if key_elements else 'Various engaging elements'}
- Visual Description: {visual_description}

## CAPTION LENGTH REQUIREMENT:
{length_instruction}

## Critical Requirements:
- NO hashtags (unless explicitly requested)
- **ZERO EMOJI in the hook/first line** - The hook MUST be clean text only
- Hook must be 2 LINES MAX - optimize for mobile "before more" view
- Write like a real person, not a marketer - use "I", "we", "you" naturally
- Go deep on each point - 2-4 sentences per paragraph, not 1-liners
- Use conversational transitions: "But here's the thing...", "Here's what I mean..."
- Emotional journey: relatable hook → substantial teaching → empowerment
- {"Natural CTA that flows from the value you provided" if use_manychat_cta else "End naturally without asking for anything - NO call-to-action whatsoever"}
- Keep emojis MINIMAL - 1-2 for entire caption max, only if they add real value, and NEVER in the hook

## Content Safety & Tone Guidelines (CRITICAL - AVOID SHADOWBAN):
- NEVER claim to "cure cancer" or any disease - this triggers immediate moderation
- NEVER use phrases like "systematically suppressed", "buried truth", "hidden knowledge"
- NEVER reference historical figures claiming their work was "disappeared" or "suppressed"
- AVOID: conspiracy narratives, "they don't want you to know", "big pharma hiding truth"
- AVOID: absolute medical claims, miracle cure language, anti-medicine framing
- AVOID: chapter labels, section headers like "The Transformation", "Practical Application"
- INSTEAD: Frame as personal exploration, wellness tips, self-discovery
- INSTEAD: Use "supporting wellness" not "curing", "consider exploring" not "the truth is"
- INSTEAD: Focus on empowerment through self-awareness, not fighting external oppression
- KEEP it grounded: What works for YOU, not what "they" are hiding

## Reference Top-Performing Captions (Study these patterns):
{reference_context}

Generate ONE powerful caption following this exact structure."""

        user_prompt = f"""Write a {caption_style} caption for this {content_type} video.

Video Analysis: {visual_description}
Vibe: {vibe}
Key Points: {', '.join(key_elements) if key_elements else 'Watch the video for context'}

Make it compelling, authentic, and designed for maximum watch time."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

    @staticmethod
    def _build_reference_context(captions: List[Dict], top_k: int = 3) -> str:
        """Build context string from reference captions"""
        if not captions:
            return "No reference captions available."

        context_parts = []
        for i, cap in enumerate(captions[:top_k], 1):
            engagement = cap.get("engagement_rate", 0)
            likes = cap.get("likes", 0)
            context_parts.append(f"""
### Reference #{i} (Likes: {likes}, Engagement: {engagement:.1f}%):
{cap.get('caption', '')}
""")

        return "\n".join(context_parts)


class VideoAnalyzer:
    """AI-powered video content analyzer"""

    def __init__(self, openrouter_client: OpenRouterClient):
        self.client = openrouter_client

    def analyze_video(self, video_path: str, existing_data: Dict = None) -> Dict:
        """
        Analyze video content to extract key information for caption generation

        Returns comprehensive analysis including:
        - Visual description
        - Content type (tutorial, motivational, story, etc.)
        - Vibe/mood (energetic, calm, intense, etc.)
        - Key elements/talking points
        - Emotional tone
        - Suggested hooks
        """
        # Start with existing metadata if available
        base_data = existing_data or {}

        # Get original caption for deeper analysis
        original_caption = base_data.get('original_caption', '')
        account = base_data.get('account', 'unknown')

        # STEP 1: Try vision-based analysis if available and video file exists
        if VISION_AVAILABLE and video_path and os.path.exists(video_path):
            print("[VideoAnalyzer] Attempting vision-based video analysis...")
            try:
                vision_analysis = analyze_video_with_vision(
                    video_path=video_path,
                    original_caption=original_caption,
                    api_key=self.client.api_key
                )

                # Verify we got good vision data
                if vision_analysis.get('visual_description') != "Video content analysis unavailable":
                    print("[VideoAnalyzer] ✓ Vision analysis successful!")
                    print(f"[VideoAnalyzer]   - Content: {vision_analysis.get('content_type', 'unknown')}")
                    print(f"[VideoAnalyzer]   - Subject: {vision_analysis.get('main_subject', 'unknown')[:60]}...")

                    # Enhance vision analysis with additional caption-specific fields
                    return {
                        "visual_description": vision_analysis.get('visual_description', ''),
                        "content_type": vision_analysis.get('content_type', 'general'),
                        "vibe": vision_analysis.get('mood', 'neutral'),
                        "key_elements": vision_analysis.get('engaging_elements', []),
                        "emotional_tone": vision_analysis.get('mood', 'neutral'),
                        "suggested_hooks": [],
                        "target_audience": "Instagram users",
                        "engagement_triggers": vision_analysis.get('engaging_elements', []),
                        "core_message": vision_analysis.get('main_subject', 'Engaging content'),
                        "value_proposition": vision_analysis.get('visual_description', 'Entertaining content')[:200],
                        # Vision-specific fields
                        "activity": vision_analysis.get('activity', ''),
                        "setting": vision_analysis.get('setting', ''),
                        "people_present": vision_analysis.get('people_present', ''),
                        "text_overlays": vision_analysis.get('text_overlays', ''),
                        "visual_style": vision_analysis.get('visual_style', ''),
                        "analysis_method": "vision",
                        "analyzed_at": datetime.now().isoformat(),
                        "model_used": "vision-analysis"
                    }
            except Exception as e:
                print(f"[VideoAnalyzer] Vision analysis failed: {e}")
                print(f"[VideoAnalyzer] Falling back to text-based analysis...")

        # STEP 2: Fall back to text-based analysis using original caption

        # Build analysis prompt with focus on extracting meaning from original caption
        system_prompt = """You are an expert video content analyzer for Instagram Reels.

Your job is to deeply analyze the original caption and metadata to understand:
1. What the video is ACTUALLY about (the core message/topic)
2. What value it provides (educational, entertainment, inspiration, etc.)
3. Who the target audience is
4. What emotional journey it takes viewers on
5. What makes it engaging or worth watching

Return your analysis as JSON with these exact fields:
{
    "visual_description": "Detailed description of what the video content is about - describe the actual topic, what's being shown or discussed",
    "content_type": "One of: tutorial, motivational, story, educational, promotional, entertainment, behind_scenes, interview, review",
    "vibe": "One of: energetic, calm, intense, inspiring, controversial, nostalgic, urgent, playful, professional, casual",
    "key_elements": ["specific main point 1", "specific main point 2", "specific main point 3"],
    "emotional_tone": "primary emotion conveyed to viewers",
    "suggested_hooks": ["specific hook based on content 1", "specific hook based on content 2", "specific hook based on content 3"],
    "target_audience": "who this content is specifically for (be specific)",
    "engagement_triggers": ["what makes people want to watch 1", "what makes people want to watch 2"],
    "core_message": "the main point or takeaway in one sentence",
    "value_proposition": "what viewers get from watching this"
}

IMPORTANT: Base your analysis on the ORIGINAL CAPTION provided. Extract the actual topic and content from it, don't make things up."""

        user_prompt = f"""Analyze this Instagram Reel for caption generation.

ORIGINAL CAPTION (this is your primary source - extract the actual content):
{original_caption if original_caption else '[No caption available]'}

PERFORMANCE METRICS:
Account: @{account}
Original Likes: {base_data.get('original_likes', 0):,}
Original Views: {base_data.get('original_views', 0):,}
Engagement Rate: {base_data.get('engagement_rate', 0):.2f}%

Your task:
1. Read the original caption carefully to understand what this video is ACTUALLY about
2. Extract the main topic, key points, and value provided
3. Identify the target audience and emotional appeal
4. Suggest hooks that would work based on the actual content

Provide comprehensive analysis as JSON."""


        try:
            response = self.client.generate_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )

            if "choices" in response and len(response["choices"]) > 0:
                content = response["choices"][0]["message"]["content"]

                # Try to parse JSON response
                try:
                    # Extract JSON from markdown if needed
                    if "```json" in content:
                        content = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        content = content.split("```")[1].split("```")[0].strip()

                    analysis = json.loads(content)
                    return {
                        **analysis,
                        "analyzed_at": datetime.now().isoformat(),
                        "model_used": self.client.model
                    }
                except json.JSONDecodeError:
                    # Fallback: parse from text response
                    return {
                        "visual_description": content,
                        "content_type": "general",
                        "vibe": "neutral",
                        "key_elements": [],
                        "analyzed_at": datetime.now().isoformat(),
                        "model_used": self.client.model
                    }

        except Exception as e:
            print(f"Video analysis error: {e}")

        # Return basic analysis if AI fails
        return {
            "visual_description": base_data.get("original_caption", "Video content"),
            "content_type": "general",
            "vibe": "neutral",
            "key_elements": [],
            "analyzed_at": datetime.now().isoformat(),
            "model_used": "fallback"
        }


class CaptionGenerator:
    """Main caption generation orchestrator with RAG and quality checking"""

    def __init__(self, openrouter_client: OpenRouterClient):
        self.client = openrouter_client
        self.analyzer = VideoAnalyzer(openrouter_client)
        self.prompt_builder = CaptionPromptBuilder()

    def generate_caption(
        self,
        video_data: Dict,
        account_id: int,
        caption_style: str = "long_form",
        reference_count: int = 5,
        manychat_keyword: str = None
    ) -> Dict:
        """
        Complete caption generation pipeline

        Args:
            video_data: Video metadata and path
            account_id: Account ID for brand voice and ManyChat config
            caption_style: long_form, short_story, or short_engagement
            reference_count: Number of reference captions to retrieve

        Returns:
            {
                "success": bool,
                "caption": str,
                "analysis": dict,
                "references_used": list,
                "quality_score": float,
                "uniqueness_score": float,
                "warnings": list
            }
        """
        try:
            # Step 1: Analyze video content
            print("Analyzing video content...")
            analysis = self.analyzer.analyze_video(
                video_data.get("video_path", ""),
                video_data
            )

            # Step 2: Retrieve reference captions (RAG)
            print("Retrieving reference captions...")
            reference_captions = self._retrieve_reference_captions(
                account_id=account_id,
                video_analysis=analysis,
                limit=reference_count
            )

            # Step 4: Build prompt - get caption length preference from account
            account_info = self._get_account_info(account_id)
            manychat_cta = account_info.get("manychat_cta", "LINK")
            caption_length_preference = account_info.get("caption_length_preference", "medium")

            # Only use ManyChat CTA if a keyword was explicitly passed in the request
            # (meaning user actually selected an offer in the UI)
            use_manychat_cta = manychat_keyword is not None and manychat_keyword.strip() != ""

            # Use the passed keyword if available, otherwise get from account (fallback)
            keyword_to_use = manychat_keyword if manychat_keyword else account_info.get("manychat_keyword", "")

            # Adjust max_tokens based on caption length preference
            if caption_length_preference == "story":
                max_tokens = 1200  # ~300-400 words
            elif caption_length_preference == "long":
                max_tokens = 900   # ~250-350 words
            elif caption_length_preference == "medium":
                max_tokens = 700   # ~180-250 words
            else:  # short
                max_tokens = 400   # ~80-120 words

            # Step 5: Build prompt
            messages = self.prompt_builder.build_caption_generation_prompt(
                video_analysis=analysis,
                reference_captions=reference_captions,
                account_info=account_info,
                manychat_cta=keyword_to_use if use_manychat_cta else manychat_cta,
                use_manychat_cta=use_manychat_cta,
                caption_style=caption_style,
                caption_length_preference=caption_length_preference
            )

            # Step 6: Generate caption
            print("Generating caption...")
            response = self.client.generate_completion(
                messages=messages,
                temperature=0.7,  # Balanced creativity
                max_tokens=max_tokens,  # Dynamic based on length preference
                reasoning=False  # Disabled - causes hanging on some models
            )

            if "choices" not in response or len(response["choices"]) == 0:
                return {"success": False, "error": "Failed to generate caption"}

            caption = response["choices"][0]["message"]["content"]

            # Step 6.5: Post-process caption - clean up formatting issues
            print("Post-processing caption...")
            print(f"BEFORE filter (first 100 chars): {caption[:100]}")
            caption = remove_chapter_labels_and_headers(caption)
            caption = filter_shadowban_triggers(caption)
            print(f"AFTER filter (first 100 chars): {caption[:100]}")
            caption = format_for_mobile_readability(caption)
            caption = improve_caption_spacing(caption)
            caption = add_emojis_if_needed(caption)
            caption = enforce_hook_length_limit(caption)  # Enforce mobile preview limit
            print(f"Caption post-processed (length: {len(caption)} chars)")

            # Step 7: Quality checking
            print("Running quality checks...")
            quality_results = self._quality_check_caption(
                caption=caption,
                analysis=analysis,
                account_info=account_info,
                reference_captions=reference_captions
            )

            return {
                "success": True,
                "caption": caption,
                "analysis": analysis,
                "references_used": [c.get("id") for c in reference_captions],
                "quality_score": quality_results["overall_score"],
                "uniqueness_score": quality_results["uniqueness_score"],
                "quality_checks": quality_results["checks"],
                "warnings": quality_results["warnings"],
                "generated_at": datetime.now().isoformat(),
                "model_used": self.client.model
            }

        except Exception as e:
            print(f"Caption generation error: {e}")
            return {"success": False, "error": str(e)}

    def _retrieve_reference_captions(
        self,
        account_id: int,
        video_analysis: Dict,
        limit: int = 5
    ) -> List[Dict]:
        """
        RAG retrieval: Find similar, high-performing captions

        Multi-factor scoring:
        - Same account (brand voice consistency)
        - High engagement (what works)
        - Similar content type/vibe
        - Recent/trending boost
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # Build multi-factor query
            query = """
            SELECT
                rc.id,
                rc.caption,
                rc.video_path,
                sc.account,
                sc.original_likes,
                sc.original_views,
                sc.engagement_rate,
                sc.scraped_at,
                rc.created_at,
                -- High engagement boost
                CASE
                    WHEN sc.engagement_rate > 5.0 THEN 3.0
                    WHEN sc.engagement_rate > 3.0 THEN 2.0
                    WHEN sc.engagement_rate > 1.0 THEN 1.5
                    ELSE 1.0
                END as engagement_boost,
                -- Recency boost (last 30 days)
                CASE
                    WHEN date(sc.scraped_at) > date('now', '-30 days') THEN 1.5
                    WHEN date(sc.scraped_at) > date('now', '-90 days') THEN 1.2
                    ELSE 1.0
                END as recency_boost
            FROM ready_content rc
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE rc.caption IS NOT NULL
              AND LENGTH(rc.caption) > 100
            ORDER BY
                (engagement_boost * recency_boost) DESC,
                sc.original_likes DESC
            LIMIT ?
            """

            cursor.execute(query, (limit,))
            rows = cursor.fetchall()

            return [dict(row) for row in rows]

        except Exception as e:
            print(f"Error retrieving reference captions: {e}")
            return []
        finally:
            conn.close()

    def _get_account_info(self, account_id: int) -> Dict:
        """Get account configuration including ManyChat CTA and brand voice"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        try:
            # Try to get from accounts table
            cursor.execute("""
                SELECT
                    id,
                    username,
                    brand_voice,
                    tone_guidelines,
                    manychat_cta,
                    manychat_keyword,
                    content_strategy
                FROM accounts
                WHERE id = ?
            """, (account_id,))

            row = cursor.fetchone()
            if row:
                return dict(row)

            # Fallback: get from source_content
            cursor.execute("""
                SELECT
                    account as username,
                    'Energetic and authentic' as brand_voice,
                    'Be relatable, use line breaks, create emotional journey' as tone_guidelines,
                    'LINK' as manychat_cta
                FROM source_content
                WHERE account IS NOT NULL
                GROUP BY account
                LIMIT 1
            """)
            row = cursor.fetchone()
            return dict(row) if row else {
                "username": "default",
                "brand_voice": "Authentic and engaging",
                "tone_guidelines": "Be relatable, use line breaks",
                "manychat_cta": "LINK"
            }

        except Exception as e:
            print(f"Error getting account info: {e}")
            return {
                "username": "default",
                "brand_voice": "Authentic",
                "tone_guidelines": "Be engaging",
                "manychat_cta": "LINK"
            }
        finally:
            conn.close()

    def _quality_check_caption(
        self,
        caption: str,
        analysis: Dict,
        account_info: Dict,
        reference_captions: List[Dict]
    ) -> Dict:
        """
        Quality validation system

        Checks:
        1. Engagement optimization (hook, CTA, emotional triggers)
        2. Brand voice consistency
        3. Uniqueness (not too similar to past captions)
        4. Length and formatting
        """
        checks = {}
        warnings = []
        scores = []

        # Check 1: Has ManyChat CTA
        manychat_cta = account_info.get("manychat_cta", "LINK")
        has_cta = manychat_cta.upper() in caption.upper()
        checks["has_cta"] = has_cta
        scores.append(1.0 if has_cta else 0.5)

        if not has_cta:
            warnings.append(f"Missing ManyChat CTA: '{manychat_cta}'")

        # Check 2: Has hook (first line should be compelling)
        lines = [l.strip() for l in caption.split('\n') if l.strip()]
        first_line = lines[0] if lines else ""
        has_hook = (
            len(first_line) < 200 and  # Not too long
            '?' in first_line or  # Question
            any(word in first_line.lower() for word in
                ['the', 'this', 'what', 'why', 'how', 'most', 'stop', 'secret', 'hidden'])
        )
        checks["has_hook"] = has_hook
        scores.append(1.0 if has_hook else 0.7)

        # Check 3: Caption length (long-form target: 300-500 words)
        word_count = len(caption.split())
        optimal_length = 300 <= word_count <= 500
        checks["optimal_length"] = optimal_length
        scores.append(1.0 if optimal_length else 0.8 if word_count >= 200 else 0.5)

        # Check 4: Line breaks for readability
        has_line_breaks = '\n\n' in caption or caption.count('\n') >= 3
        checks["has_line_breaks"] = has_line_breaks
        scores.append(1.0 if has_line_breaks else 0.7)

        # Check 5: No hashtags
        has_hashtags = '#' in caption
        checks["no_hashtags"] = not has_hashtags
        scores.append(1.0 if not has_hashtags else 0.3)

        if has_hashtags:
            warnings.append("Caption contains hashtags (should be none)")

        # Check 6: Uniqueness score (simple version - semantic similarity)
        uniqueness_score = self._calculate_uniqueness_score(caption, reference_captions)
        checks["uniqueness_score"] = uniqueness_score
        scores.append(uniqueness_score)

        if uniqueness_score < 0.7:
            warnings.append(f"Caption too similar to past posts (uniqueness: {uniqueness_score:.2f})")

        # Overall quality score
        overall_score = sum(scores) / len(scores)

        return {
            "overall_score": overall_score,
            "uniqueness_score": uniqueness_score,
            "checks": checks,
            "warnings": warnings,
            "word_count": word_count
        }

    def _calculate_uniqueness_score(
        self,
        caption: str,
        reference_captions: List[Dict]
    ) -> float:
        """
        Calculate uniqueness score (0-1, higher is more unique)

        Simple version: Check for similar phrases and structure
        Production: Use semantic similarity with embeddings
        """
        if not reference_captions:
            return 1.0

        caption_words = set(caption.lower().split())
        max_similarity = 0

        for ref in reference_captions:
            ref_caption = ref.get("caption", "")
            if not ref_caption:
                continue

            ref_words = set(ref_caption.lower().split())

            # Jaccard similarity
            intersection = len(caption_words & ref_words)
            union = len(caption_words | ref_words)
            similarity = intersection / union if union > 0 else 0

            max_similarity = max(max_similarity, similarity)

        # Uniqueness = 1 - similarity
        return 1.0 - max_similarity


# Singleton instance
_openrouter_client = None
_caption_generator = None


def get_caption_generator() -> CaptionGenerator:
    """Get or create caption generator singleton"""
    global _openrouter_client, _caption_generator

    if _caption_generator is None:
        _openrouter_client = OpenRouterClient()
        _caption_generator = CaptionGenerator(_openrouter_client)

    return _caption_generator


def get_recent_captions_for_avoidance(limit: int = 15) -> str:
    """
    Retrieve recent AI-generated captions to avoid repetitive hooks and patterns

    Returns formatted context of used hooks, phrases, and patterns to avoid
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        # Get recent AI-generated captions
        cursor.execute("""
            SELECT rc.caption, rc.created_at, sc.account
            FROM ready_content rc
            LEFT JOIN source_content sc ON rc.source_id = sc.id
            WHERE rc.caption IS NOT NULL
              AND LENGTH(rc.caption) > 50
              AND rc.created_at > datetime('now', '-7 days')
            ORDER BY rc.created_at DESC
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()

        if not rows:
            return ""

        # Extract hooks, phrases, and concepts to avoid
        hooks_seen = set()
        phrases_seen = set()
        concepts_seen = set()
        words_seen = {}

        for row in rows:
            caption = row['caption']

            # Get first 2 lines as hook (more comprehensive)
            lines = caption.split('\n')
            if len(lines) >= 2:
                hook_text = f"{lines[0].strip()} {lines[1].strip()}"
            elif lines:
                hook_text = lines[0].strip()
            else:
                hook_text = caption[:100]

            # Remove common punctuation for better matching
            clean_hook = hook_text.rstrip('?!.,:;').lower().strip()
            if len(clean_hook) > 10 and len(clean_hook) < 150:
                hooks_seen.add(clean_hook)

            # Extract common phrases (3-5 word sequences)
            words = caption.lower().replace('\n', ' ').split()
            for i in range(len(words) - 2):
                phrase = ' '.join(words[i:i+3])
                if len(phrase) > 15 and len(phrase) < 60:
                    # Skip very common phrases
                    if not any(word in ['comment', 'below', 'link', 'bio', 'follow', 'like', 'this is', 'the', 'a', 'an'] for word in phrase.split()):
                        phrases_seen.add(phrase)

                # Extract 4-word phrases too
                if i < len(words) - 3:
                    phrase4 = ' '.join(words[i:i+4])
                    if len(phrase4) > 20 and len(phrase4) < 70:
                        if not any(word in ['comment', 'below', 'link', 'bio', 'follow', 'like', 'this is', 'the truth', 'the secret'] for word in phrase4.split()):
                            phrases_seen.add(phrase4)

            # Extract key concepts (single words that are overused)
            import re
            # Extract meaningful words (not common stop words)
            meaningful_words = re.findall(r'\b[a-z]{4,}\b', caption.lower())
            stop_words = {'this', 'that', 'with', 'from', 'have', 'been', 'were', 'they', 'them', 'your', 'body', 'just', 'like', 'more', 'only', 'even', 'back', 'into', 'over', 'such'}
            for word in meaningful_words:
                if word not in stop_words:
                    words_seen[word] = words_seen.get(word, 0) + 1

        # Build comprehensive avoidance context
        context = "\n\n## RECENTLY USED HOOKS (DO NOT REPEAT):\n"
        for hook in sorted(hooks_seen)[:15]:
            context += f"- {hook}\n"

        context += "\n## OVERUSED PHRASES (AVOID VARIATIONS):\n"
        for phrase in sorted(list(phrases_seen))[:20]:
            context += f"- {phrase}\n"

        # Add overused concepts (words used 5+ times)
        overused_concepts = {word: count for word, count in words_seen.items() if count >= 5}
        if overused_concepts:
            context += "\n## OVERUSED CONCEPTS (FIND SYNONYMS):\n"
            for word, count in sorted(overused_concepts.items(), key=lambda x: x[1], reverse=True)[:10]:
                context += f"- {word} (used {count} times recently)\n"

        context += f"\n**CRITICAL**: Create something FRESH and UNIQUE. Do not use similar wording, concepts, or patterns to what's listed above."

        print(f"[Deduplication] Found {len(hooks_seen)} recent hooks, {len(phrases_seen)} phrases, {len(overused_concepts)} overused concepts to avoid")
        return context

    except Exception as e:
        print(f"Error retrieving recent captions for deduplication: {e}")
        return ""
    finally:
        conn.close()


def generate_caption_for_source(source_id: int) -> bool:
    """
    Generate AI caption for a source_content entry (background processing)
    Updates the ready_content table when complete

    This version uses enhanced video understanding and analysis

    Args:
        source_id: Source content ID to process

    Returns:
        bool: True if successful
    """
    # Import here to avoid circular dependency
    from database import update_processing_status, create_ready_content

    # Track start time for metrics
    start_time = datetime.now()

    # Mark as processing
    update_processing_status(source_id, 'processing')
    print(f"[AI Processing] Started processing source {source_id}")

    try:
        # Get source content from database
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM source_content WHERE id = ?", (source_id,))
        source = cursor.fetchone()
        conn.close()

        if not source:
            error_msg = f"Source {source_id} not found"
            print(f"[AI Processing] ERROR: {error_msg}")
            update_processing_status(source_id, 'failed', error_msg)
            return False

        # Convert Row object to dictionary for .get() access
        source = dict(source)

        # Check if already processed
        if source['status'] == 'prepared':
            print(f"[AI Processing] Source {source_id} already prepared")
            update_processing_status(source_id, 'completed')
            return True

        # Get the ManyChat keyword and notes
        manychat_keyword = source.get('manychat_keyword', 'LINK')
        manychat_notes = source.get('manychat_notes', '')
        account = source.get('account', 'unknown')

        print(f"[AI Processing] Generating caption for source {source_id} with keyword '{manychat_keyword}'...")

        # Initialize OpenRouter client and VideoAnalyzer
        client = OpenRouterClient()
        analyzer = VideoAnalyzer(client)

        # Build video data dict for analysis
        video_data = {
            "video_path": source['video_path'],
            "video_filename": source['video_filename'],
            "account": account,
            "original_caption": source.get('original_caption', ''),
            "original_likes": source.get('original_likes', 0),
            "original_views": source.get('original_views', 0),
            "engagement_rate": source.get('engagement_rate', 0),
            "manychat_keyword": manychat_keyword,
            "manychat_notes": manychat_notes
        }

        # Step 1: Analyze video content using AI
        print("Analyzing video content for better understanding...")
        analysis = analyzer.analyze_video(
            video_path=source['video_path'],
            existing_data=video_data
        )

        print(f"Video analysis complete: {analysis.get('content_type', 'unknown')} - {analysis.get('vibe', 'unknown')}")

        # Step 2: Build enhanced context with analysis results
        video_context = f"""
## VIDEO FILE INFO
Filename: {source['video_filename']}
Account: @{account}

## PERFORMANCE DATA
Original Likes: {source.get('original_likes', 0):,}
Original Views: {source.get('original_views', 0):,}
Engagement Rate: {source.get('engagement_rate', 0):.2f}%

## ORIGINAL CAPTION (for reference)
{source.get('original_caption', 'No original caption')}

## AI VIDEO ANALYSIS
Content Type: {analysis.get('content_type', 'general')}
Vibe/Mood: {analysis.get('vibe', 'neutral')}
Emotional Tone: {analysis.get('emotional_tone', 'engaging')}
Target Audience: {analysis.get('target_audience', 'general audience')}

## CORE MESSAGE
{analysis.get('core_message', 'Engaging content worth watching')}

## VALUE PROPOSITION
{analysis.get('value_proposition', 'Entertaining and informative content')}

## KEY VIDEO ELEMENTS DETECTED
{chr(10).join(f"• {elem}" for elem in analysis.get('key_elements', ['General engaging content']))}

## WHAT MAKES THIS ENGAGING
{chr(10).join(f"• {elem}" for elem in analysis.get('engagement_triggers', ['Interesting content']))}

## VISUAL DESCRIPTION
{analysis.get('visual_description', 'Engaging video content')}

## SUGGESTED HOOKS
{chr(10).join(f"• {hook}" for hook in analysis.get('suggested_hooks', ['Engaging hook', 'Curiosity-driven opener']))}
{f'''
## MANYCHAT CONFIGURATION
Keyword: {manychat_keyword}
Offer Context: {manychat_notes if manychat_notes else 'Lead generation and engagement'}

Include a natural call-to-action at the end: "Comment "{manychat_keyword}" below" or similar variation.
''' if manychat_keyword and manychat_keyword.strip() else '''
## NO CTA NEEDED
End the caption naturally without any call-to-action or engagement bait.
'''}"""

        # Step 3.5: Get recent captions for deduplication
        recent_captions_context = get_recent_captions_for_avoidance()

        # Step 3.6: Get RAG learning context from top performers
        rag_context = ""
        if HEALTH_SYSTEMS_AVAILABLE:
            try:
                rag_system = get_rag_system()
                rag_context = rag_system.build_learning_context(analysis, limit_examples=3)
                print(f"[RAG] Added learning context from top performers")
            except Exception as e:
                print(f"[RAG] Failed to get learning context: {e}")

        # Step 3: Get brand voice profile if available
        brand_voice_data = None
        brand_voice_context = ""
        emoji_rules = ""
        hashtag_rules = ""
        spacing_rules = ""

        brand_voice_id = source.get('brand_voice_id')
        if brand_voice_id:
            print(f"Loading brand voice profile ID: {brand_voice_id}")
            try:
                brand_voice_data = get_brand_voice_for_caption_by_id(brand_voice_id)
                print(f"Brand voice loaded: {brand_voice_data.get('tone', 'Unknown')}")

                # Build detailed brand voice context from profile
                preferences = brand_voice_data.get('preferences', {})
                guidelines = brand_voice_data.get('guidelines', '')

                # Build conditional EMOJI rules based on preference
                emoji_pref = preferences.get('emojis', 'moderate').lower()
                if emoji_pref == 'none':
                    emoji_rules = """**EMOJI USAGE:** NO EMOJIS AT ALL - Write clean text without any emojis"""
                elif emoji_pref == 'minimal':
                    emoji_rules = """**EMOJI USAGE:** Maximum 1-2 emojis for ENTIRE caption - NEVER in the first line/hook"""
                elif emoji_pref == 'moderate':
                    emoji_rules = """**EMOJI USAGE:** 2-4 emojis strategically placed - NEVER in the first line/hook"""
                else:  # abundant
                    emoji_rules = """**EMOJI USAGE:** Use emojis freely throughout for visual engagement - but NEVER in the first line/hook"""

                # Build conditional HASHTAG rules based on preference
                hashtag_pref = preferences.get('hashtags', 'none').lower()
                if hashtag_pref == 'none':
                    hashtag_rules = """**HASHTAGS:** NO HASHTAGS - Do not include any hashtags at the end"""
                elif hashtag_pref == 'minimal':
                    hashtag_rules = """**HASHTAGS:** Maximum 3-5 highly relevant hashtags at the end"""
                elif hashtag_pref == 'moderate':
                    hashtag_rules = """**HASHTAGS:** 5-10 relevant hashtags at the end"""
                else:  # abundant
                    hashtag_rules = """**HASHTAGS:** 10-15 relevant hashtags at the end for maximum reach"""

                # Build conditional SPACING rules
                spacing_pref = preferences.get('spacing', 'standard').lower()
                if spacing_pref == 'casual':
                    spacing_rules = """**SPACING:** Use generous paragraph breaks - every 1-2 sentences should be a new paragraph. Keep paragraphs short (1-2 lines max) for easy mobile reading."""
                elif spacing_pref == 'dense':
                    spacing_rules = """**SPACING:** Use compact spacing - 3-4 sentences per paragraph. More content per paragraph, fewer breaks."""
                else:  # standard
                    spacing_rules = """**SPACING:** Use balanced paragraph breaks - 2-3 sentences per paragraph. Standard Instagram formatting."""

                brand_voice_context = f"""

## BRAND VOICE PROFILE
{guidelines}

## WRITING STYLE SETTINGS
- Grammar: {preferences.get('grammar', 'standard')}
- Slang: {preferences.get('slang', 'minimal')}
- Caption Length: {preferences.get('length', 'medium')}
{f'''
## MANYCHAT KEYWORD FOR THIS PROFILE
{brand_voice_data.get('manychat_cta', manychat_keyword)}
''' if brand_voice_data.get('manychat_cta') or manychat_keyword else ''}
"""
            except Exception as e:
                print(f"Error loading brand voice: {e}")
                brand_voice_data = None

        # Fallback to basic brand voice if not found
        if not brand_voice_data:
            emoji_rules = """**EMOJI USAGE:** Maximum 1-2 emojis for ENTIRE caption - NEVER in the first line/hook"""
            hashtag_rules = """**HASHTAGS:** Include 5-10 relevant hashtags at the end"""
            spacing_rules = """**SPACING:** Use balanced paragraph breaks - 2-3 sentences per paragraph."""
            caption_length_pref = "medium"
            brand_voice_context = f"""

## BRAND VOICE GUIDELINES
Tone: Authentic, relatable, and engaging
- Be conversational, not preachy
- Share value without making exaggerated claims
- Use natural language that sounds like a real person
- Focus on genuine insights and helpful information
- Avoid controversy, shock tactics, or unrealistic promises
- Be transparent and honest

CONTENT PRINCIPLES:
- Provide genuine value first
- Build trust through authenticity
- Educate and inform, don't just sell
- Connect emotionally through shared experiences
- Respect the audience's intelligence
"""
        else:
            caption_length_pref = brand_voice_data.get('preferences', {}).get('length', 'medium')

        # Build user prompt based on caption length preference
        length_instruction = ""
        max_tokens = 2000
        use_two_part_generation = False

        if caption_length_pref == "story":
            # Use 2-part generation for story mode to avoid cutoffs
            use_two_part_generation = True
            length_instruction = """
**STORY MODE - PART 1 OF 2 (CHAPTERS 1-4)**

Write a DEEP, MULTI-CHAPTER narrative Instagram caption. This is PART 1 of 2.

Write the FIRST 4 CHAPTERS (350-450 words total):

**CHAPTER 1 - THE HOOK (50-75 words)**
Start with a powerful, scroll-stopping statement. Use curiosity gaps, counter-intuitive claims, or bold revelations.
BAD: "Have you ever wondered about..."
GOOD: "You've been lied to about your body's true potential"

**CHAPTER 2 - THE SETUP (75-100 words)**
Immediately bridge from the hook with a specific story, example, or context. Use "you" and "your" to involve the reader. Add specific details like numbers, names, dates.
BAD: "Many people believe that..."
GOOD: "In 1903, Georges Lakhovsky invented a device that was installed in hospitals across Europe. It cured cancer. Then it disappeared."

**CHAPTER 3 - THE REVELATION (75-100 words)**
Reveal the core insight, secret, or truth. Build emotional tension. Make it feel significant and transformative.
BAD: "The truth is that our bodies are powerful."
GOOD: "Your body isn't a machine. It's a living, breathing electromagnetic field. And for 100 years, this knowledge has been systematically suppressed."

**CHAPTER 4 - THE EVIDENCE (75-100 words)**
Back up your claims with proof. Use specific examples, studies, or historical facts. Make it undeniable.
BAD: "Studies show this works."
GOOD: "When Royal Rife demonstrated this in 1934, medical witnesses watched under microscopes as pathogens were destroyed in real-time. The results were documented, then buried."

STOP after Chapter 4. Part 2 will continue with Chapters 5-7.

Remember: NO chapter headers like "Chapter 1:". Just write the flowing narrative.

**LENGTH LIMIT: Maximum 350 words for Part 1. STOP after chapter 4. Do NOT write chapters 5-7 yet.
"""
            max_tokens = 1000  # First part limit - strictly controlled to prevent runaway generation
        elif caption_length_pref == "short":
            length_instruction = """
**SHORT MODE - PUNCHY & CONCISE**

Write a brief, impactful caption (50-100 words maximum).

Get straight to the point. Every word must count.
"""
            max_tokens = 800
        else:  # medium or long
            length_instruction = """
**STANDARD MODE - BALANCED LENGTH**

Write a well-developed caption (200-300 words).

Build a complete thought with supporting details.
"""
            max_tokens = 2000

        print(f"[DEBUG] caption_length_preference={caption_length_pref}, max_tokens={max_tokens}, two_part={use_two_part_generation}")

        messages = [
            {
                "role": "system",
                "content": f"""You are an ELITE Instagram copywriter and conversion psychologist. You write captions that:

✅ STOP THE SCROLL immediately with powerful hooks
✅ Build genuine connection through authenticity
✅ Drive meaningful engagement and comments
✅ Convert naturally through helpful CTAs
✅ Feel like a real person, not marketing copy

## 🚨 CRITICAL: THE FIRST 1-2 LINES ARE EVERYTHING

Most people NEVER click "more". Your hook MUST work in the preview.

❌ NEVER USE THESE WEAK OPENINGS:
- "Have you ever..."
- "I've been thinking about..."
- "Today I want to share..."
- "In this video I'll show..."
- "Welcome back to my channel"
- "Hey everyone, today..."
- "I wanted to talk about..."

✅ USE THESE POWER HOOK PATTERNS:

🎯 CURIOSITY GAPS (Negative - creates fear of missing out):
- "Stop ignoring this sign"
- "The mistake killing your [result]"
- "What nobody tells you about [topic]"
- "You've been doing [topic] wrong your whole life"
- "The silent killer of your [goal]"
- "Why most people fail at [topic]"
- "This one thing is ruining your progress"

🎯 CURIOSITY GAPS (Positive - creates anticipation):
- "The one thing that changed everything"
- "I finally figured out [topic]"
- "This shifted my entire perspective"
- "This single hack transformed my [result]"
- "The breakthrough that made the difference"
- "Why this works when nothing else does"

🎯 COUNTER-INTUITIVE (challenges assumptions):
- "The opposite is actually true"
- "Unpopular opinion but..."
- "You've been lied to about [topic]"
- "Everything you know about [topic] is wrong"
- "This goes against conventional wisdom"
- "Here's why the gurus are wrong"

🎯 PERSONAL REVELATION (creates vulnerability):
- "I'll never forget the moment"
- "Here's something I learned the hard way"
- "Can I be honest for a second?"
- "This is uncomfortable to admit..."
- "I wish someone had told me this earlier"
- "The mistake that cost me years"

🎯 DIRECT CHALLENGE (creates engagement):
- "What if I told you..."
- "Let me ask you something"
- "Ready for the truth?"
- "Here's what nobody wants to admit"
- "You need to hear this"

🎯 BOLD CLAIM (creates intrigue):
- "This is the [superlative] way to..."
- "I discovered the secret to..."
- "The [topic] hack that changed everything"
- "Why [common advice] is dead wrong"

## CRITICAL OPENING PARAGRAPH RULES

After your hook, the FIRST PARAGRAPH must immediately deliver value and maintain engagement:

✅ DO IN THE OPENING:
- Bridge from hook to substance immediately
- Add specific detail or evidence
- Make it personal and relatable
- Use "you" and "your" to involve the reader
- Keep paragraphs short (2-3 sentences max)
- Create emotional resonance

❌ DON'T DO IN THE OPENING:
- Use generic filler phrases
- Repeat the hook without adding value
- Start with "So", "Basically", or "Essentially"
- Go off on tangents
- Use business jargon or buzzwords
- Make it sound like a marketing intro

**EXAMPLE OPENING STRUCTURE:**
Hook: "The mistake killing your progress"
Opening: "I spent 3 years stuck in the same place. Trying everything. Getting nowhere. Then I discovered the one thing holding me back..."

## BODY CONTENT QUALITY STANDARDS

After your opening, EVERY paragraph must add NEW value and advance the narrative:

✅ **DO IN BODY PARAGRAPHS:**
- **Use specific examples**: "When I studied the Tesla coil..." not "When you study technology..."
- **Include real stories**: "In 1903, Lakhovsky's device was installed in hospitals..." not generic claims
- **Add actionable insights**: "Here's how to test this: place your hands..." not vague concepts
- **Vary sentence structure**: Mix short punchy sentences with longer explanatory ones
- **Build logical flow**: Each paragraph should connect to and advance from the previous one
- **Use the "you" perspective**: "You can test this by..." not "People can test..."
- **Add numbers and specifics**: "After 47 days..." not "After some time..."
- **Create emotional arcs**: Build tension, then release; create curiosity, then satisfy it

❌ **DON'T DO IN BODY PARAGRAPHS:**
- **Repeat the same concept**: Don't say "electromagnetic" 5 times in 5 different ways
- **Use vague generalities**: "Many people believe..." without specifics
- **Go off on tangents**: Stay focused on ONE core narrative thread
- **Make claims without evidence**: Back up statements with examples
- **Use business jargon**: No "synergy," "leverage," "optimize," etc.
- **Be preachy**: Share discoveries, don't lecture
- **Use filler phrases**: "It's important to note," "Essentially," "Basically"

**ANTI-REPETITION RULE:**
If you've used a word or concept in the last 2 paragraphs, find a DIFFERENT way to express the next idea. Every paragraph must add NEW information, not restate old information in different words.

**STORY STRUCTURE FOR LONG CAPTIONS:**
If writing story length (750-1000+ words), structure as a journey:
1. **Hook & Setup** (100-150 words) - The problem and what's at stake
2. **Personal Discovery** (150-200 words) - How you found this or a specific story
3. **The Secret Revealed** (150-200 words) - The core insight or mechanism
4. **Proof & Evidence** (100-150 words) - Real examples, studies, or history
5. **Practical Application** (100-150 words) - How the reader can use this
6. **Transformation** (100-150 words) - What becomes possible
7. **Conclusion** (100-150 words) - Final thought and call to reflection

## ANTI-REPETITION SYSTEM

**CRITICAL: Avoid repeating yourself at all costs.**

❌ **REPETITION PATTERNS TO AVOID:**
- Don't use the same word more than twice in a paragraph
- Don't repeat the same concept in different paragraphs
- Don't say "electromagnetic" then "biofield" then "energy field" in 3 consecutive sentences
- Don't repeat your hook at the end without adding new insight
- Don't use the same sentence structure throughout

✅ **VARIETY TECHNIQUES:**
- **Mix sentence lengths**: Short punchy (5-10 words) + Medium (15-25 words) + Long (25-40 words)
- **Vary sentence starts**: Don't start every sentence with "The" or "This" or "It's"
- **Use different perspectives**: Sometimes "you", sometimes "we", sometimes "I", sometimes passive voice
- **Change paragraph structure**: Some short (2 sentences), some longer (4-5 sentences)
- **Use synonyms**: If you used "body" 3 times, switch to "physical form", "organism", "vessel", "being"

**PROOFREADING CHECK:**
Before finishing, scan your caption for:
1. Words used more than 3 times → Find synonyms
2. Similar sentence structures → Mix it up
3. Repeated concepts → Merge or delete one
4. Consecutive sentences starting with same word → Rewrite

**EXAMPLE OF REPETITION TO AVOID:**
BAD: "Your body is electromagnetic. Your body has energy fields. Your body can heal itself."
GOOD: "Your body is electromagnetic. Every cell contains energy fields. This physical form can regenerate itself."

**VARIETY INJECTION:**
- Add specific numbers: "After 47 days..." not "After some time..."
- Include names: "When Tesla discovered..." not "When researchers found..."
- Use sensory details: "Feel the pulse..." not "Observe the rhythm..."
- Change verbs: Instead of "is/are/was/were" use "becomes/reveals/demonstrates/proves"

## STRONG ENDING & CONCLUSION PATTERNS

The ending is just as important as the hook. It's what people remember and share.

❌ **WEAK ENDINGS TO AVOID:**
- "Thanks for reading!" (generic, adds no value)
- "Follow for more!" (self-serving, weak)
- "Let me know your thoughts!" (lazy engagement bait)
- "Drop a comment below!" (cliché, overused)
- "Share this with someone who needs it!" (preachy)
- Trail off without completing the thought
- Repeat the hook without adding new insight
- End with a generic platitude

✅ **USE THESE POWERFUL ENDING PATTERNS:**

🎯 **CALL TO REFLECTION (makes them think):**
- "The question isn't whether this is true. The question is: what will you do with this information now?"
- "So I'll ask you again: are you ready to see what's been hidden in plain sight?"
- "This isn't about believing me. It's about believing what's already inside you."
- "The real question: why was this hidden? And what else don't you know?"

🎯 **CALL TO ACTION (specific, meaningful):**
- "If you're ready to go deeper, comment 'GUIDE' below and I'll send you the full breakdown."
- "Save this for when you need to remember: your body is not a machine. It's a miracle."
- "Share this with someone who's been searching for answers."

🎯 **POWER STATEMENT (memorable):**
- "This changes everything. And once you see it, you can't unsee it."
- "Your body knows. It's been waiting for you to remember."
- "The truth has always been there. Waiting for you to notice."

🎯 **OPEN LOOP (creates curiosity):**
- "And here's the thing nobody talks about: what happens when we all remember?"
- "Which brings us to the real question: if this works, what else are we capable of?"
- "The best part? This is just the beginning."

🎯 **PERSONAL COMMITMENT (creates accountability):**
- "I'm done ignoring this. And I hope you are too."
- "From now on, I'm making a different choice. I hope you'll join me."

🎯 **VISIONARY ENDING (inspires hope):**
- "Imagine what becomes possible when millions of us remember this together."
- "We're at the edge of a massive shift. And you're part of it."
- "The future belongs to those who remember who they really are."

**ENDING RULES:**
- End with IMPACT, not filler
- Leave them with something to think about
- Make it shareable (people quote good endings)
- If using CTA, make it specific and valuable
- NO generic engagement bait

## CRITICAL PRODUCTION RULES

You are writing a FINAL, PRODUCTION-READY Instagram caption that will be posted directly.

**MANDATORY:**
- NO section headers (no "HOOK:", "BODY:", "COMMENT BAIT:", "MANYCHAT CTA:", "FORMATTING:", etc.)
- NO meta-commentary (no "This caption uses...", no "The hook creates...", etc.)
- NO structure descriptions - just write the actual caption
- Start directly with the caption text - no headers, no labels

{emoji_rules}

{hashtag_rules}

{spacing_rules}

**CAPTION LENGTH:**
- 100-200 words for standard length
- 750-1000+ words for story length (when specified)

{brand_voice_context}"""
            },
            {
                "role": "user",
                "content": f"""Write a PRODUCTION-READY Instagram caption for this video:

{video_context}
{recent_captions_context}
{rag_context}
{length_instruction}
**CRITICAL - THIS IS FOR DIRECT POSTING:**

Write the FINAL caption text only - NO headers, NO labels, NO structure descriptions.

Start directly with the caption content - a compelling opening statement, followed by body paragraphs, ending naturally or with the ManyChat CTA if specified.

**Content Type**: {analysis.get('content_type', 'general')}
**Vibe**: {analysis.get('vibe', 'engaging')}
**Audience**: {analysis.get('target_audience', 'general')}

CRITICAL: Create something FRESH - don't repeat hooks from recent captions above!

Generate the caption now:"""
            }
        ]

        response = client.generate_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=max_tokens,
            reasoning=False  # Disabled - causes hanging
        )

        if "error" in response:
            error_msg = f"API Error: {response['error']}"
            print(f"[AI Processing] {error_msg}")
            update_processing_status(source_id, 'failed', error_msg)
            return False

        if "choices" not in response or len(response["choices"]) == 0:
            error_msg = "No caption generated - empty response from API"
            print(f"[AI Processing] {error_msg}")
            update_processing_status(source_id, 'failed', error_msg)
            return False

        caption = response["choices"][0]["message"]["content"]

        # Clean up the caption
        caption = caption.strip()

        # Remove markdown code blocks if present
        if caption.startswith("```"):
            caption = caption.split("```")[1] if "```" in caption else caption
            caption = caption.replace("```", "").strip()

        # COMPREHENSIVE POST-PROCESSING: Remove all unwanted AI-generated content
        # This matches the cleanup done in app.py for consistency

        # Remove all bold markdown (**)
        caption = caption.replace('**', '')

        # Remove section headers (HOOK:, BODY:, COMMENT BAIT:, MANYCHAT CTA:, FORMATTING:, etc.)
        lines = caption.split('\n')
        cleaned_lines = []

        for line in lines:
            line_upper = line.strip().upper()
            line_stripped = line.strip()

            # Skip section headers
            if any(header in line_upper for header in ['HOOK:', 'BODY:', 'COMMENT BAIT:', 'MANYCHAT CTA:', 'FORMATTING:', 'CTA:', 'INTRO:', 'OUTRO:']):
                continue

            # Skip chapter headers
            if line_stripped.startswith('**CHAPTER') and ':' in line_stripped:
                continue
            if line_stripped.startswith('CHAPTER ') and ':' in line_stripped:
                continue
            if line_stripped.startswith('**') and line_stripped.endswith('**') and 'CHAPTER' in line_upper:
                continue

            # Skip lines that describe the caption (meta-commentary)
            if any(phrase in line.lower() for phrase in ['this caption aims to', 'this caption is designed', 'this caption uses', 'the hook creates', 'the caption is structured', 'here is a', 'here\'s a', 'below is a', 'following is a']):
                continue

            # Skip lines that are just instructions
            if any(phrase in line.lower() for phrase in ['[optional]', '[insert', '(optional)', '(add', '(include', '—']):
                continue

            cleaned_lines.append(line)

        caption = '\n'.join(cleaned_lines).strip()

        # Remove multiple consecutive blank lines
        import re
        caption = re.sub(r'\n\n\n+', '\n\n', caption)

        # 2-PART GENERATION: For story mode, generate the second part to avoid cutoffs
        if use_two_part_generation and caption_length_pref == "story":
            print(f"[AI Processing] Using 2-part generation for story mode")
            print(f"[AI Processing] Part 1 completed with {len(caption)} characters")

            # Store part 1
            part1 = caption

            # Get the last few sentences of part 1 to provide context for continuation
            part1_lines = caption.split('\n')
            part1_context = '\n'.join(part1_lines[-3:]) if len(part1_lines) > 3 else caption

            # Generate part 2
            part2_messages = [
                {
                    "role": "system",
                    "content": f"""You are continuing a DEEP, MULTI-CHAPTER Instagram caption narrative.

## YOUR TASK - PART 2 OF 2 (CHAPTERS 5-7):

Continue the caption from where it left off. Write CHAPTERS 5-7 (300-400 words total).

The first half ended with:
{part1_context}

**CHAPTER 5 - THE TRANSFORMATION (75-100 words)**
Describe what becomes possible. Show the before/after. Paint a picture of the new reality.
Example: "When you remember this, everything changes. You stop trusting external authority and start trusting your own body. You realize you were never broken—you were just disconnected."

**CHAPTER 6 - PRACTICAL APPLICATION (75-100 words)**
Give specific, actionable steps. Make it tangible. Use "you" and "your."
Example: "Here's how to test this: Place your hands on your chest. Feel that pulse? That's not just a heartbeat. That's electromagnetic communication. Your cells are talking to each other right now."

**CHAPTER 7 - THE CONCLUSION (75-100 words)**
End with power. Use one of these patterns:
- CALL TO REFLECTION: "The question isn't whether this is true. The question is: what will you do with this information now?"
- POWER STATEMENT: "Your body knows. It's been waiting for you to remember."
- VISIONARY: "Imagine what becomes possible when millions of us remember this together."
- OPEN LOOP: "And here's the thing nobody talks about: what happens when we all remember?"

NO generic endings like "Thanks for reading!" or "Follow for more!"

{emoji_rules}

{hashtag_rules}

{spacing_rules}

**CRITICAL:**
- NO chapter headers like "Chapter 5:" - just flow naturally
- Start directly with continuation text
- Make it feel like ONE cohesive narrative
- End with IMPACT
"""
                },
                {
                    "role": "user",
                    "content": f"""Continue this Instagram caption. Write Chapters 5-7 (300-400 words).

First half ended with:
\"{part1_context}\"

Continue with:
- Chapter 5: The Transformation
- Chapter 6: Practical Application
- Chapter 7: Powerful Conclusion

Make it flow naturally. End with something memorable.

**Content Type**: {analysis.get('content_type', 'general')}
**Vibe**: {analysis.get('vibe', 'engaging')}

Continue the caption now:"""
                }
            ]

            print(f"[AI Processing] Generating part 2...")
            part2_response = client.generate_completion(
                messages=part2_messages,
                temperature=0.7,
                max_tokens=2000,  # Second part limit
                reasoning=False
            )

            if "error" in part2_response:
                print(f"[AI Processing] Part 2 generation failed: {part2_response['error']}")
                print(f"[AI Processing] Using part 1 only ({len(part1)} characters)")
                caption = part1  # Fall back to part 1 only
            elif "choices" not in part2_response or len(part2_response["choices"]) == 0:
                print(f"[AI Processing] Part 2 returned empty, using part 1 only")
                caption = part1
            else:
                part2 = part2_response["choices"][0]["message"]["content"].strip()

                # Clean up part 2
                part2 = part2.replace('**', '')  # Remove bold markdown
                # Remove any meta-commentary from part 2
                if any(phrase in part2.lower() for phrase in ['here is the continuation', 'part 2', 'continued from', 'second half']):
                    part2_lines = part2.split('\n')
                    part2_lines = [l for l in part2_lines if not any(phrase in l.lower() for phrase in ['here is the continuation', 'part 2:', 'continued from', 'second half:'])]
                    part2 = '\n'.join(part2_lines).strip()

                # Stitch parts together with a smooth transition
                # Check if part1 ends mid-sentence or mid-paragraph
                if part1.endswith('...') or len(part1.split('\n')[-1]) < 50:
                    # Part 1 ended mid-paragraph, just concatenate
                    caption = part1 + ' ' + part2
                else:
                    # Part 1 ended at a natural break, add paragraph break
                    caption = part1 + '\n\n' + part2

                print(f"[AI Processing] Part 2 completed with {len(part2)} characters")
                print(f"[AI Processing] Total stitched caption: {len(caption)} characters")

                # Clean up the stitched caption
                caption = re.sub(r'\n\n\n+', '\n\n', caption)  # Remove excessive line breaks
                caption = caption.strip()

        # Only add ManyChat CTA if keyword is set (not empty)

        # Only add ManyChat CTA if keyword is set (not empty)
        if manychat_keyword and manychat_keyword.strip() and manychat_keyword.upper() not in caption.upper():
            print(f"[AI Processing] Adding ManyChat CTA with keyword '{manychat_keyword}'")
            caption = f"{caption}\n\nComment \"{manychat_keyword}\" below"
        elif not manychat_keyword or not manychat_keyword.strip():
            print(f"[AI Processing] No ManyChat keyword set, skipping CTA")

        # POST-PROCESSING: Enforce brand voice hashtag preference
        if brand_voice_data:
            hashtag_pref = brand_voice_data.get('preferences', {}).get('hashtags', 'moderate').lower()
            if hashtag_pref == 'none':
                # Remove all hashtags from the caption
                import re
                caption = re.sub(r'\s*#\w+\b', '', caption)
                # Remove trailing whitespace after removing hashtags
                caption = caption.strip()
                print(f"[AI Processing] Removed all hashtags (brand voice preference: none)")

        # Validate caption quality - reject truly corrupted content
        import string
        printable_chars = set(string.printable)
        non_printable = sum(1 for c in caption if c not in printable_chars)
        non_printable_ratio = non_printable / len(caption) if caption else 0

        # Only reject if there's a LOT of non-printable characters (>30%)
        # This catches actual corruption, not legitimate technical content
        if non_printable_ratio > 0.3:
            error_msg = f"Caption validation failed: non_printable_ratio={non_printable_ratio:.2f}"
            print(f"[AI Processing] ERROR: {error_msg}")
            print(f"[AI Processing] Caption preview: {caption[:200]}...")
            update_processing_status(source_id, 'failed', error_msg)
            return False

        print(f"Generated caption for source {source_id} with {len(caption)} characters")

        # Save to ready_content with enhanced metadata
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO ready_content
            (source_id, video_path, caption, hashtags, sound_name, sound_url, status, notes)
            VALUES (?, ?, ?, '', '', '', 'ready', ?)
        """, (
            source_id,
            source['video_path'],
            caption,
            json.dumps({
                "keyword_used": manychat_keyword,
                "content_type": analysis.get('content_type', 'unknown'),
                "vibe": analysis.get('vibe', 'unknown'),
                "target_audience": analysis.get('target_audience', 'unknown'),
                "generated_at": datetime.now().isoformat(),
                "model_used": client.model
            })
        ))

        ready_content_id = cursor.lastrowid

        # Track metrics for agent health
        if HEALTH_SYSTEMS_AVAILABLE:
            try:
                metrics_tracker = get_metrics_tracker()

                # Calculate processing time
                processing_time = (datetime.now() - start_time).total_seconds() if 'start_time' in locals() else 0

                # Log generation metrics
                metrics_tracker.log_generation(
                    source_id=source_id,
                    ready_content_id=ready_content_id,
                    model_used=client.model,
                    vision_used=analysis.get('analysis_method') == 'vision',
                    processing_time=processing_time,
                    caption=caption,
                    quality_scores={
                        'overall_score': 85,  # Placeholder - could run actual quality check
                        'uniqueness_score': 80,
                        'brand_voice_adherence': 90
                    }
                )

                print(f"[AI Processing] Metrics logged for health tracking")

                # Benchmark against production
                benchmarker = get_benchmarker()
                benchmark_result = benchmarker.compare_to_production(caption)
                print(f"[AI Processing] Benchmark: {benchmark_result['recommendation']} ({benchmark_result['uniqueness_vs_production']:.0f}% unique)")

                # Send to Archon for knowledge graph
                archon = get_archon()
                archon.ingest_caption_knowledge({
                    'caption_id': ready_content_id,
                    'caption': caption,
                    'analysis': analysis,
                    'metadata': {
                        'source_id': source_id,
                        'model': client.model,
                        'generated_at': datetime.now().isoformat()
                    }
                })

            except Exception as e:
                print(f"[AI Processing] Metrics tracking failed: {e}")

        # Update source status
        cursor.execute("""
            UPDATE source_content
            SET status = 'prepared'
            WHERE id = ?
        """, (source_id,))

        conn.commit()
        conn.close()

        print(f"[AI Processing] Successfully processed source {source_id}")
        # Mark as completed
        update_processing_status(source_id, 'completed')
        return True

    except Exception as e:
        error_msg = f"{str(e)}"
        print(f"[AI Processing] ERROR processing source {source_id}: {error_msg}")
        import traceback
        traceback.print_exc()
        # Mark as failed with error message
        update_processing_status(source_id, 'failed', error_msg[:500])  # Limit error message length
        return False
