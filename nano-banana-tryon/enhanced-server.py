#!/usr/bin/env python3
"""
Enhanced Server with Nano Banana Glasses API Integration
Includes both simple and enhanced glasses processing
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

# Configuration
PORT = 7173
DIRECTORY = "."

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or "YOUR_API_KEY_HERE"
genai.configure(api_key=GEMINI_API_KEY)

# Initialize Nano Banana model
try:
    model = genai.GenerativeModel('gemini-2.0-flash-exp')
    nano_banana_available = True
except:
    nano_banana_available = False
    print("⚠️  Nano Banana (Gemini) not configured. Please set GEMINI_API_KEY")

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

class EnhancedHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_path = urlparse(self.path)

            # Handle static routes
            if parsed_path.path == '/virtual-try-on' or self.path == '/' or self.path == '/3d-reconstruction':
                self.path = '/public/index.html'
            elif self.path == '/try-on-from-photo':
                self.path = '/public/ai-glasses-editor.html'
            elif self.path == '/try-on-from-photo-enhanced':
                self.path = '/templates/enhanced-glasses-editor.html'
            elif self.path.startswith('/src/'):
                pass  # Let super().do_GET() handle it

            # Handle CORS preflight
            if self.path == '/favicon.ico':
                return

            super().do_GET()

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def do_POST(self):
        """Handle POST requests for API endpoints"""
        try:
            parsed_path = urlparse(self.path)

            if parsed_path.path == '/api/enhance-glasses':
                self.handle_enhance_glasses()
            elif parsed_path.path == '/api/quick-enhance':
                self.handle_quick_enhance()
            elif parsed_path.path == '/api/glasses-styles':
                self.handle_glasses_styles()
            elif parsed_path.path.startswith('/api/get-enhanced/'):
                self.handle_get_enhanced(parsed_path.path)
            else:
                self.send_error(404, "API endpoint not found")

        except Exception as e:
            self.send_error(500, f"API error: {str(e)}")

    def handle_enhance_glasses(self):
        """Enhanced glasses processing with Nano Banana precision"""
        try:
            if not nano_banana_available:
                self.send_json_response({
                    'error': 'Nano Banana (Gemini) API not configured. Please set GEMINI_API_KEY environment variable.'
                }, status=500)
                return

            # Parse multipart form data
            content_type = self.headers.get('Content-Type', '')
            if not content_type.startswith('multipart/form-data'):
                self.send_json_response({'error': 'Invalid content type'}, status=400)
                return

            # Get form data
            form_data = self.parse_multipart()

            user_photo = form_data.get('user_photo')
            glasses_image = form_data.get('glasses_image')
            custom_prompt = form_data.get('custom_prompt', '')

            if not user_photo:
                self.send_json_response({'error': 'User photo required'}, status=400)
                return

            # Load images
            user_image = Image.open(io.BytesIO(user_photo))
            prompt = NANO_BANANA_MASTER_PROMPT

            # Add glasses reference if provided
            if glasses_image:
                ref_glasses = Image.open(io.BytesIO(glasses_image))
                prompt += """

REFERENCE GLASSES INSTRUCTIONS:
- Use the uploaded reference glasses as the exact style and model
- Match the frame design, color, and lens characteristics precisely
- Maintain the same proportions and features as shown in reference
- Apply this exact style to the user's face with proper positioning"""

            if custom_prompt:
                prompt += f"""

USER SPECIFIC REQUIREMENTS:
{custom_prompt}

Apply these requirements while maintaining all the absolute precision standards above."""

            prompt += """

EXECUTION INSTRUCTIONS:
1. Analyze the user's photo for exact positioning, lighting, and environment
2. Place glasses with perfect alignment and realism
3. Apply subtle blending and color correction
4. Ensure 100% preservation of original image characteristics
5. Return only the final perfect result

Remember: You are Nano Banana - deliver absolute perfection."""

            # Generate with Nano Banana
            inputs = [prompt, user_image]
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
                            'image_path': temp_path.split('/')[-1],  # Just filename for serving
                            'timestamp': datetime.now().isoformat(),
                            'message': 'Nano Banana enhancement complete with 100% precision'
                        })
                        return

            self.send_json_response({'error': 'Nano Banana processing failed'}, status=500)

        except Exception as e:
            self.send_json_response({'error': f'Processing error: {str(e)}'}, status=500)

    def handle_quick_enhance(self):
        """Quick enhancement without custom glasses"""
        try:
            if not nano_banana_available:
                self.send_json_response({
                    'error': 'Nano Banana (Gemini) API not configured. Please set GEMINI_API_KEY environment variable.'
                }, status=500)
                return

            form_data = self.parse_multipart()
            user_photo = form_data.get('user_photo')
            glasses_style = form_data.get('style', 'professional')

            if not user_photo:
                self.send_json_response({'error': 'User photo required'}, status=400)
                return

            user_image = Image.open(io.BytesIO(user_photo))

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
                        enhanced_image = self.apply_final_polish(enhanced_image)

                        temp_path = tempfile.mktemp(suffix='.png')
                        enhanced_image.save(temp_path, 'PNG', quality=100)

                        self.send_json_response({
                            'success': True,
                            'image_path': temp_path.split('/')[-1],
                            'timestamp': datetime.now().isoformat()
                        })
                        return

            self.send_json_response({'error': 'Enhancement failed'}, status=500)

        except Exception as e:
            self.send_json_response({'error': str(e)}, status=500)

    def handle_glasses_styles(self):
        """Get available glasses styles"""
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
        self.send_json_response({'styles': styles})

    def handle_get_enhanced(self, path):
        """Serve enhanced image"""
        try:
            filename = path.split('/')[-1]
            # Security check - ensure filename is safe
            if not filename or '..' in filename or '/' in filename:
                self.send_error(403, "Invalid filename")
                return

            # Try to find the file in temp directory
            import glob
            possible_files = glob.glob(f"/tmp/{filename}*")
            if not possible_files:
                possible_files = glob.glob(f"/var/folders/*/{filename}*")  # macOS temp directories

            if possible_files:
                with open(possible_files[0], 'rb') as f:
                    content = f.read()

                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_error(404, "Image not found")

        except Exception as e:
            self.send_error(500, f"Error serving image: {str(e)}")

    def parse_multipart(self):
        """Parse multipart form data"""
        content_length = int(self.headers.get('Content-Length', 0))
        content = self.rfile.read(content_length)

        # Simple multipart parser (basic implementation)
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

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        # Set proper MIME types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
        super().end_headers()

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

def start_enhanced_server():
    """Start the enhanced server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), EnhancedHTTPRequestHandler) as httpd:
        print(f"🍌 Enhanced Nano Banana Glasses Server Started!")
        print(f"📍 Server running at: http://localhost:{PORT}")
        print(f"")
        print(f"📱 Available Routes:")
        print(f"   Quick Mode: http://localhost:{PORT}/try-on-from-photo")
        print(f"   Enhanced Mode: http://localhost:{PORT}/try-on-from-photo-enhanced")
        print(f"   3D Reconstruction: http://localhost:{PORT}/3d-reconstruction")
        print(f"")
        if nano_banana_available:
            print(f"✨ Nano Banana (Gemini) API: CONNECTED")
            print(f"🎯 Extreme precision mode: ACTIVE")
        else:
            print(f"⚠️  Nano Banana (Gemini) API: NOT CONFIGURED")
            print(f"   Set GEMINI_API_KEY environment variable to enable")
        print(f"")
        print(f"🛑 Press Ctrl+C to stop the server")

        # Auto-open browser
        try:
            webbrowser.open(f'http://localhost:{PORT}/try-on-from-photo-enhanced')
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Enhanced server stopped gracefully")

if __name__ == "__main__":
    start_enhanced_server()