#!/usr/bin/env python3
"""
Enhanced HTTP server for Nano Banana Glasses Editor
Includes both simple and enhanced glasses processing with API endpoints
"""

import http.server
import socketserver
import os
import webbrowser
import json
import io
import base64
import tempfile
from pathlib import Path
from urllib.parse import urlparse, parse_qs
import google.generativeai as genai
from PIL import Image, ImageEnhance
import re
from datetime import datetime

# Configuration - default port, can be overridden with environment variable
PORT = int(os.environ.get('PORT', 7173))
DIRECTORY = "."

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or "YOUR_API_KEY_HERE"
try:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    nano_banana_available = True
except:
    nano_banana_available = False
    model = None

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

OUTPUT REQUIREMENTS:
- Return only the final enhanced image
- NO watermarks, text, or signatures
- Maximum quality preservation
- Perfect photorealistic results
"""

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        try:
            # Handle the /virtual-try-on and /3d-reconstruction routes
            if self.path == '/virtual-try-on' or self.path == '/' or self.path == '/3d-reconstruction':
                self.path = '/public/index.html'
            elif self.path == '/try-on-from-photo':
                self.path = '/public/ai-glasses-editor.html'
            elif self.path == '/try-on-from-photo-enhanced':
                self.path = '/templates/enhanced-glasses-editor.html'
            elif self.path == '/try-on-from-photo-multi':
                self.path = '/templates/multi-photo-enhanced.html'
            elif self.path == '/src/virtual-try-on.js':
                self.path = '/src/virtual-try-on.js'
            elif self.path == '/src/working-glasses.js':
                self.path = '/src/working-glasses.js'
            elif self.path.startswith('/src/'):
                # Handle all other src files
                pass  # Let super().do_GET() handle it

            # Handle CORS preflight
            if self.path == '/favicon.ico':
                return

            super().do_GET()
        except Exception as e:
            print(f"Error handling GET {self.path}: {e}")
            self.send_error(500, f"Server error: {str(e)}")

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Set proper MIME types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
        super().end_headers()

    def do_POST(self):
        """Handle POST requests for API endpoints"""
        try:
            parsed_path = urlparse(self.path)

            if parsed_path.path == '/api/multi-photo-enhance':
                self.handle_multi_photo_enhance()
            else:
                self.send_error(404, "API endpoint not found")

        except Exception as e:
            self.send_error(500, f"API error: {str(e)}")

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def handle_multi_photo_enhance(self):
        """Multi-photo enhanced glasses processing"""
        try:
            if not nano_banana_available:
                self.send_json_response({
                    'error': 'Nano Banana (Gemini) API not configured. Please set GEMINI_API_KEY environment variable.'
                }, status=500)
                return

            # Parse multipart form data with multiple photos
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_json_response({'error': 'Invalid content type'}, status=400)
                return

            form_data = self.parse_multipart()

            # Collect all user photos
            user_photos = []
            for key in form_data:
                if key.startswith('user_photo_') and form_data[key]:
                    user_photos.append(form_data[key])

            if len(user_photos) == 0:
                self.send_json_response({'error': 'No photos provided'}, status=400)
                return

            glasses_image = form_data.get('glasses_image')
            glasses_style = form_data.get('style', 'professional')

            # Use the first photo as the primary reference
            primary_image = Image.open(io.BytesIO(user_photos[0]))

            # Enhanced multi-photo prompt for processing multiple photos separately
            prompt = f"""
{NANO_BANANA_MASTER_PROMPT}

CRITICAL MULTI-PHOTO PROCESSING INSTRUCTIONS:
I am processing {len(user_photos)} separate photos that need glasses added. Each photo must be processed individually with the following rules:

ABSOLUTE CHARACTER PRESERVATION RULES (1000% ACCURACY REQUIRED):
1. Each photo's character must remain 100% identical to the original
2. NO changes to facial features, expressions, or characteristics whatsoever
3. NO alterations to the person's appearance - only add glasses
4. Process each photo independently - do not combine reference angles
5. Maintain exact same person in each photo, just with glasses added

PROCESSING METHODOLOGY:
- Process each uploaded photo one by one
- Apply the same glasses style to each person in each photo
- Preserve every original detail of the person in every photo
- Each photo should get its own separate enhanced version
- No cross-contamination between photos - treat each as unique

PRECISION REQUIREMENTS:
- Character preservation: 1000% absolute accuracy
- Face preservation: Perfect maintenance of all features
- Expression preservation: Keep exact original expressions
- Quality preservation: Maintain original photo quality
- Only addition: Glasses - nothing else changes"""

            # Add glasses reference if provided
            if glasses_image:
                ref_glasses = Image.open(io.BytesIO(glasses_image))
                prompt += """

CUSTOM GLASSES REFERENCE:
- Use the uploaded reference glasses as the exact style and model
- Match the frame design, color, and lens characteristics precisely
- Apply this exact style to the person's face with perfect multi-angle analysis"""
            else:
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
                prompt += f"""

STYLE SPECIFICATION: Add {glasses_description} with multi-photo precision analysis."""

            prompt += """

EXECUTION WITH MULTI-PHOTO PRECISION:
1. Analyze all reference photos for complete 3D understanding
2. Place glasses with perfect alignment on primary photo
3. Ensure consistency with all reference angles and features
4. Apply ultra-realistic lighting and shadow blending
5. Return only the final perfect result

Multi-photo analysis enabled: Deliver absolute perfection."""

            # Generate with Nano Banana
            inputs = [prompt, primary_image]
            if glasses_image:
                inputs.append(ref_glasses)

            response = model.generate_content(inputs)

            # Process the enhanced image
            if hasattr(response, 'candidates') and len(response.candidates) > 0:
                if hasattr(response.candidates[0], 'content') and len(response.candidates[0].content.parts) > 0:
                    if hasattr(response.candidates[0].content.parts[0], 'inline_data'):
                        enhanced_image_data = response.candidates[0].content.parts[0].inline_data.data
                        enhanced_image = Image.open(io.BytesIO(enhanced_image_data))
                        enhanced_image = self.apply_final_polish(enhanced_image)

                        # Save to temporary file
                        temp_path = tempfile.mktemp(suffix='.png')
                        enhanced_image.save(temp_path, 'PNG', quality=100, optimize=False)

                        self.send_json_response({
                            'success': True,
                            'image_path': temp_path.split('/')[-1],
                            'timestamp': datetime.now().isoformat(),
                            'message': f'Multi-photo Nano Banana enhancement complete with {len(user_photos)} references analyzed',
                            'photos_analyzed': len(user_photos)
                        })
                        return

            self.send_json_response({'error': 'Multi-photo processing failed'}, status=500)

        except Exception as e:
            self.send_json_response({'error': f'Multi-photo processing error: {str(e)}'}, status=500)

    def parse_multipart(self):
        """Parse multipart form data"""
        content_length = int(self.headers.get('Content-Length', 0))
        content = self.rfile.read(content_length)

        # Simple multipart parser
        boundary = self.headers.get('Content-Type').split('boundary=')[1].encode()
        parts = content.split(b'--' + boundary)

        form_data = {}

        for part in parts[1:-1]:  # Skip first and last parts
            if b'Content-Disposition' in part:
                lines = part.split(b'\r\n')
                for line in lines:
                    if line.startswith(b'Content-Disposition:'):
                        if b'name=' in line:
                            # Extract field name
                            name_match = re.search(b'name="([^"]*)"', line)
                            if name_match:
                                field_name = name_match.group(1).decode('utf-8')

                                # Find file data
                                data_start = part.find(b'\r\n\r\n') + 4
                                data_end = part.find(b'\r\n--')

                                if data_start > 3 and data_end > data_start:
                                    file_data = part[data_start:data_end]
                                    form_data[field_name] = file_data

        return form_data

    def apply_final_polish(self, image):
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

    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

def start_server():
    """Start the local development server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🍌 Nano Banana 3D Reconstruction Server Started!")
        print(f"📍 Server running at: http://localhost:{PORT}/virtual-try-on")
        print(f"📁 Serving directory: {DIRECTORY}/")
        print(f"🛑 Press Ctrl+C to stop the server")

        # Auto-open browser
        try:
            webbrowser.open(f'http://localhost:{PORT}/virtual-try-on')
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped gracefully")

if __name__ == "__main__":
    start_server()