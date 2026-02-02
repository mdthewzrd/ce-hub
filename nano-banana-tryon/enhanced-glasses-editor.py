#!/usr/bin/env python3
"""
Enhanced Nano Banana Glasses Editor with Extreme Precision Prompting
Perfect image preservation + Custom glasses upload + Screenshot paste support
"""

from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
import io
import base64
from PIL import Image, ImageEnhance
import requests
import tempfile
import json
from datetime import datetime
import re

app = Flask(__name__)
CORS(app)

# Configure Gemini API - Using latest Nano Banana (Gemini)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or "YOUR_API_KEY_HERE"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize with latest Gemini model for best Nano Banana performance
model = genai.GenerativeModel('gemini-2.0-flash-exp')

# Enhanced Nano Banana Prompt Template
NANO_BANANA_MASTER_PROMPT = """
You are Nano Banana, the world's most precise AI photo editor specializing in photorealistic accessory placement.

CRITICAL MISSION: Add glasses to the uploaded photo with 100% absolute precision and perfection.

ABSOLUTE REQUIREMENTS (NO EXCEPTIONS):
1. FACE PRESERVATION: Maintain 100% accuracy of original facial features, expressions, skin tone, hair, and characteristics
2. POSE PRESERVATION: Keep exact same body posture, head angle, facial expression, and positioning
3. ENVIRONMENT PRESERVATION: Preserve exact background, location, lighting conditions, shadows, and atmosphere
4. TECHNICAL PRESERVATION: Maintain original aspect ratio, resolution, color grading, and image quality
5. REALISM: Glasses must appear physically worn with perfect lighting, shadows, and reflections matching the scene

GLASSES PLACEMENT SPECIFICATIONS:
- Align perfectly with eye level and facial symmetry
- Match head tilt and camera angle exactly
- Realistic temple arms going behind ears (when visible)
- Proper bridge alignment on nose
- Lens transparency and reflections matching scene lighting
- Cast realistic shadows on face
- Match skin tone around glasses contact points

LIGHTING & REALISM:
- Match existing light sources and shadows
- Add subtle specular highlights on lenses
- Create realistic reflections based on environment
- Ensure glasses cast appropriate shadows
- Blend seamlessly with skin tones

QUALITY STANDARDS:
- No artifacts, blurring, or quality degradation
- No visible editing or manipulation痕迹
- Maintain original photo's mood and atmosphere
- Professional-grade photorealism

EDITING REQUIREMENTS:
- Apply subtle color correction for perfect blending
- Add micro-level shadows and highlights
- Ensure perfect edge integration
- Maintain natural skin texture around glasses
- Apply final polish pass for seamless integration

OUTPUT REQUIREMENTS:
- Return only the final enhanced image
- NO watermarks, text, or signatures
- Maximum quality preservation
- Perfect photorealistic results

Failure to meet any of these requirements is unacceptable. Every detail must be perfect.
"""

@app.route('/')
def index():
    """Enhanced glasses editor page"""
    return render_template('enhanced-glasses-editor.html')

@app.route('/api/enhance-glasses', methods=['POST'])
def enhance_glasses():
    """Enhanced glasses processing with Nano Banana precision"""
    try:
        # Get uploaded images
        user_photo = request.files.get('user_photo')
        glasses_image = request.files.get('glasses_image')
        custom_prompt = request.form.get('custom_prompt', '')

        # Handle base64 pasted images
        user_photo_data = request.form.get('user_photo_data')
        glasses_data = request.form.get('glasses_data')

        if user_photo_data:
            user_photo = convert_base64_to_image(user_photo_data)
        elif not user_photo:
            return jsonify({'error': 'User photo required'}), 400

        if glasses_data:
            glasses_image = convert_base64_to_image(glasses_data)

        # Load images
        user_image = Image.open(user_photo.stream if hasattr(user_photo, 'stream') else user_photo)

        # Build precise prompt
        prompt = NANO_BANANA_MASTER_PROMPT

        if glasses_image:
            # Load reference glasses
            ref_glasses = Image.open(glasses_image.stream if hasattr(glasses_image, 'stream') else glasses_image)
            prompt += f"""

REFERENCE GLASSES INSTRUCTIONS:
- Use the uploaded reference glasses as the exact style and model
- Match the frame design, color, and lens characteristics precisely
- Maintain the same proportions and features as shown in reference
- Apply this exact style to the user's face with proper positioning

Important: The reference glasses show the desired style - recreate this style perfectly on the user's face."""

        if custom_prompt:
            prompt += f"""

USER SPECIFIC REQUIREMENTS:
{custom_prompt}

Apply these requirements while maintaining all the absolute precision standards above."""

        # Enhanced prompt for Nano Banana
        prompt += """

EXECUTION INSTRUCTIONS:
1. Analyze the user's photo for exact positioning, lighting, and environment
2. Place glasses with perfect alignment and realism
3. Apply subtle blending and color correction
4. Ensure 100% preservation of original image characteristics
5. Return only the final perfect result

Remember: You are Nano Banana - deliver absolute perfection."""

        # Generate with enhanced precision
        response = model.generate_content([
            prompt,
            user_image
        ] + ([ref_glasses] if glasses_image else []))

        # Process the enhanced image
        if hasattr(response, 'candidates') and len(response.candidates) > 0:
            if hasattr(response.candidates[0], 'content') and len(response.candidates[0].content.parts) > 0:
                if hasattr(response.candidates[0].content.parts[0], 'inline_data'):
                    enhanced_image_data = response.candidates[0].content.parts[0].inline_data.data

                    # Convert to PIL Image
                    enhanced_image = Image.open(io.BytesIO(enhanced_image_data))

                    # Apply final quality enhancement
                    enhanced_image = apply_final_polish(enhanced_image)

                    # Save to temporary file
                    temp_path = tempfile.mktemp(suffix='.png')
                    enhanced_image.save(temp_path, 'PNG', quality=100, optimize=False)

                    return jsonify({
                        'success': True,
                        'image_path': temp_path,
                        'timestamp': datetime.now().isoformat(),
                        'message': 'Nano Banana enhancement complete with 100% precision'
                    })

        return jsonify({'error': 'Nano Banana processing failed'}), 500

    except Exception as e:
        return jsonify({'error': f'Processing error: {str(e)}'}), 500

@app.route('/api/quick-enhance', methods=['POST'])
def quick_enhance():
    """Quick enhancement without custom glasses"""
    try:
        user_photo = request.files.get('user_photo')
        user_photo_data = request.form.get('user_photo_data')
        glasses_style = request.form.get('style', 'professional sunglasses')

        if user_photo_data:
            user_photo = convert_base64_to_image(user_photo_data)
        elif not user_photo:
            return jsonify({'error': 'User photo required'}), 400

        user_image = Image.open(user_photo.stream if hasattr(user_photo, 'stream') else user_photo)

        # Style-specific prompts
        style_prompts = {
            'aviator': 'classic aviator sunglasses with gold metal frame and dark lenses',
            'wayfarer': 'iconic wayfarer style with black plastic frame',
            'cat_eye': 'feminine cat-eye glasses with upswept frame',
            'round': 'vintage round frame glasses like John Lennon style',
            'professional': 'modern professional glasses with subtle metal frame',
            'sport': 'athletic sport sunglasses with wraparound design',
            'vintage': 'retro vintage style glasses with horn-rimmed frame',
            'minimalist': 'ultra-thin minimalist frame glasses'
        }

        glasses_description = style_prompts.get(glasses_style, 'modern professional glasses')

        prompt = f"""
{NANO_BANANA_MASTER_PROMPT}

STYLE SPECIFICATION: Add {glasses_description} to the person in the photo.

Follow all absolute precision requirements while adding this specific glasses style."""

        response = model.generate_content([prompt, user_image])

        # Process result
        if hasattr(response, 'candidates') and len(response.candidates) > 0:
            if hasattr(response.candidates[0], 'content') and len(response.candidates[0].content.parts) > 0:
                if hasattr(response.candidates[0].content.parts[0], 'inline_data'):
                    enhanced_image_data = response.candidates[0].content.parts[0].inline_data.data
                    enhanced_image = Image.open(io.BytesIO(enhanced_image_data))
                    enhanced_image = apply_final_polish(enhanced_image)

                    temp_path = tempfile.mktemp(suffix='.png')
                    enhanced_image.save(temp_path, 'PNG', quality=100)

                    return jsonify({
                        'success': True,
                        'image_path': temp_path,
                        'timestamp': datetime.now().isoformat()
                    })

        return jsonify({'error': 'Enhancement failed'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

def convert_base64_to_image(base64_data):
    """Convert base64 string to image file"""
    # Remove data URL prefix if present
    base64_data = re.sub(r'^data:image/.+;base64,', '', base64_data)

    # Decode and convert
    image_data = base64.b64decode(base64_data)
    return io.BytesIO(image_data)

def apply_final_polish(image):
    """Apply final quality polish to enhanced image"""
    try:
        # Subtle enhancement for perfect blending
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.02)

        # Slight contrast adjustment
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.01)

        # Very subtle color enhancement
        enhancer = ImageEnhance.Color(image)
        image = enhancer.enhance(1.005)

        return image
    except:
        return image

@app.route('/api/get-enhanced/<path:filename>')
def get_enhanced(filename):
    """Serve enhanced image"""
    try:
        return send_file(filename, mimetype='image/png')
    except:
        return jsonify({'error': 'Image not found'}), 404

@app.route('/api/glasses-styles')
def get_glasses_styles():
    """Get available glasses styles with descriptions"""
    styles = [
        {"id": "aviator", "name": "Aviator", "description": "Classic pilot-style with metal frame"},
        {"id": "wayfarer", "name": "Wayfarer", "description": "Iconic square-frame style"},
        {"id": "cat_eye", "name": "Cat Eye", "description": "Feminine upswept frames"},
        {"id": "round", "name": "Round", "description": "Vintage circular frames"},
        {"id": "professional", "name": "Professional", "description": "Modern business frames"},
        {"id": "sport", "name": "Sport", "description": "Athletic wraparound design"},
        {"id": "vintage", "name": "Vintage", "description": "Retro horn-rimmed style"},
        {"id": "minimalist", "name": "Minimalist", "description": "Ultra-thin delicate frames"}
    ]
    return jsonify({'styles': styles})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print("🍌 Enhanced Nano Banana Glasses Editor Starting...")
    print(f"📍 Running at: http://localhost:{port}")
    print("🎯 Extreme precision mode activated")
    print("✨ Supporting custom glasses upload and screenshot paste")
    print("🔧 Nano Banana precision prompting engaged")

    app.run(debug=True, port=port)