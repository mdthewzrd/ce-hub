#!/usr/bin/env python3
"""
Glasses Photo Editor using Nano Banana (Gemini AI)
Simple API for adding glasses to photos with extreme accuracy
"""

from flask import Flask, request, jsonify, render_template, send_file
from flask_cors import CORS
import google.generativeai as genai
import os
import io
import base64
from PIL import Image
import requests
import tempfile
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or "YOUR_API_KEY_HERE"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash-exp')

@app.route('/')
def index():
    """Main glasses editor page"""
    return render_template('glasses-editor.html')

@app.route('/api/add-glasses', methods=['POST'])
def add_glasses():
    """Add glasses to uploaded photo using Nano Banana"""
    try:
        # Get uploaded image
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400

        file = request.files['image']
        glasses_style = request.form.get('style', 'modern sunglasses')

        # Convert to PIL Image
        image = Image.open(file.stream)

        # Create prompt for Nano Banana
        prompt = f"""
        You are Nano Banana, an expert AI image editor specializing in photorealistic accessory placement.

        TASK: Add {glasses_style} to this person's photo with extreme precision

        CRITICAL REQUIREMENTS:
        1. Maintain EXACT original image quality and resolution
        2. Add glasses that perfectly match face orientation and lighting
        3. Ensure glasses fit naturally on face bridge
        4. Match glass reflections to existing lighting in photo
        5. Preserve all facial features, expressions, and skin texture
        6. NO artifacts, blurring, or quality degradation
        7. Keep original skin tone, hair, and clothing colors exactly the same

        TECHNICAL SPECIFICATIONS:
        - Glasses should appear to be physically worn
        - Lenses should have realistic transparency/reflection
        - Frame should align with eye level and face symmetry
        - Temple arms should go behind ears naturally
        - Consider face shape and angle for proper positioning

        STYLE NOTES: {glasses_style}

        Output only the final enhanced image. Do NOT add watermarks, text, or signatures.
        """

        # Generate with Gemini
        response = model.generate_content([
            prompt,
            image
        ])

        # Get the enhanced image
        if hasattr(response, 'candidates') and len(response.candidates) > 0:
            if hasattr(response.candidates[0], 'content') and len(response.candidates[0].content.parts) > 0:
                if hasattr(response.candidates[0].content.parts[0], 'inline_data'):
                    enhanced_image_data = response.candidates[0].content.parts[0].inline_data.data

                    # Convert to PIL Image
                    enhanced_image = Image.open(io.BytesIO(enhanced_image_data))

                    # Save to temporary file
                    temp_path = tempfile.mktemp(suffix='.png')
                    enhanced_image.save(temp_path, 'PNG', quality=100)

                    return jsonify({
                        'success': True,
                        'image_path': temp_path,
                        'timestamp': datetime.now().isoformat()
                    })

        return jsonify({'error': 'Failed to generate enhanced image'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/get-enhanced/<path:filename>')
def get_enhanced(filename):
    """Serve enhanced image"""
    try:
        return send_file(filename, mimetype='image/png')
    except:
        return jsonify({'error': 'Image not found'}), 404

@app.route('/api/glasses-styles')
def get_glasses_styles():
    """Get available glasses styles"""
    styles = [
        {"id": "aviator", "name": "Aviator", "description": "Classic pilot-style sunglasses"},
        {"id": "wayfarer", "name": "Wayfarer", "description": "Iconic square-frame style"},
        {"id": "cat_eye", "name": "Cat Eye", "description": "Feminine upswept frames"},
        {"id": "round", "name": "Round", "description": "Circular frame design"},
        {"id": "clubmaster", "name": "Clubmaster", "description": "Browline frame style"},
        {"id": "rectangle", "name": "Rectangle", "description": "Clean rectangular frames"},
        {"id": "oval", "name": "Oval", "description": "Soft oval-shaped frames"},
        {"id": "sports", "name": "Sports", "description": "Athletic wraparound sunglasses"},
        {"id": "vintage", "name": "Vintage", "description": "Retro-style frames"},
        {"id": "minimalist", "name": "Minimalist", "description": "Thin, delicate frames"}
    ]
    return jsonify({'styles': styles})

if __name__ == '__main__':
    print("🕶️ Nano Banana Glasses Editor Starting...")
    print("📍 Running at: http://localhost:5000")
    print("🎯 Ready to add glasses to photos with extreme accuracy!")

    app.run(debug=True, port=5000)