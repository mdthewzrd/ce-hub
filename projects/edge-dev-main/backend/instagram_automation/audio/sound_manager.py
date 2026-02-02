"""
Simple Sound Manager for Instagram
Add and manage sounds for your Reels
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from pathlib import Path
import json

from audio.processor import AudioProcessor, create_reel_with_sound
from audio.manager import AudioManager

app = Flask(__name__)
CORS(app)

# Configuration
SOUNDS_DIR = Path(__file__).parent.parent.parent / "sounds_library"
SOUNDS_DIR.mkdir(exist_ok=True)

audio_manager = AudioManager()
processor = AudioProcessor()


# ============================================================
# API Routes
# ============================================================

@app.route('/')
def index():
    """Serve the sound manager interface"""
    return '''
<!DOCTYPE html>
<html>
<head>
    <title>Instagram Sound Manager</title>
    <meta charset="utf-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
        }
        .section {
            margin: 30px 0;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 15px;
        }
        .sound-form {
            display: grid;
            gap: 15px;
            max-width: 500px;
        }
        input, textarea {
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
        }
        input:focus, textarea:focus {
            outline: none;
            border-color: #667eea;
        }
        button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
        }
        button:hover {
            transform: translateY(-2px);
        }
        .sound-list {
            display: grid;
            gap: 15px;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
        .sound-card {
            background: white;
            padding: 15px;
            border-radius: 10px;
            border: 2px solid #e0e0e0;
        }
        .sound-card h3 {
            color: #333;
            margin-bottom: 5px;
        }
        .sound-card p {
            color: #666;
            font-size: 14px;
        }
        .info-box {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .success-box {
            background: #e8f5e9;
            border-left: 4px solid #4caf50;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .file-input {
            border: 2px dashed #667eea;
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            cursor: pointer;
        }
        .file-input:hover {
            background: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎵 Instagram Sound Manager</h1>
        <p class="subtitle">Add sounds to your videos before posting to Instagram</p>

        <div class="info-box">
            <strong>How it works:</strong><br>
            1. Upload a sound (MP3/WAV) or provide a URL<br>
            2. Select a video to add the sound to<br>
            3. Download the ready-to-post Reel with sound embedded<br>
            4. Upload to Instagram - the sound will be recognized!
        </div>

        <div class="section">
            <h2>Add New Sound</h2>
            <form id="soundForm" class="sound-form">
                <input type="text" id="soundName" placeholder="Sound name" required>
                <input type="text" id="soundArtist" placeholder="Artist name">
                <input type="url" id="soundUrl" placeholder="Preview URL (optional)">
                <input type="file" id="soundFile" accept="audio/*">
                <button type="submit">Add Sound</button>
            </form>
        </div>

        <div class="section">
            <h2>Create Reel with Sound</h2>
            <form id="reelForm" class="sound-form">
                <select id="soundSelect" required style="padding: 12px; border-radius: 8px;">
                    <option value="">Select a sound...</option>
                </select>
                <input type="file" id="videoFile" accept="video/*" required>
                <button type="submit">Create Reel + Sound</button>
            </form>
        </div>

        <div class="section">
            <h2>Your Sounds</h2>
            <div id="soundList" class="sound-list">
                <p style="color: #666;">Loading sounds...</p>
            </div>
        </div>
    </div>

    <script>
        // Load sounds on page load
        loadSounds();

        // Add sound form
        document.getElementById('soundForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData();
            formData.append('name', document.getElementById('soundName').value);
            formData.append('artist', document.getElementById('soundArtist').value);
            formData.append('url', document.getElementById('soundUrl').value);

            const file = document.getElementById('soundFile').files[0];
            if (file) {
                formData.append('file', file);
            }

            const response = await fetch('/api/sounds', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                alert('Sound added successfully!');
                document.getElementById('soundForm').reset();
                loadSounds();
            } else {
                alert('Error adding sound');
            }
        });

        // Create reel form
        document.getElementById('reelForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const soundId = document.getElementById('soundSelect').value;
            const videoFile = document.getElementById('videoFile').files[0];

            if (!soundId || !videoFile) {
                alert('Please select a sound and video');
                return;
            }

            const formData = new FormData();
            formData.append('sound_id', soundId);
            formData.append('video', videoFile);

            alert('Processing... this may take a moment');

            const response = await fetch('/api/create-reel', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'reel_with_sound.mp4';
                a.click();
                alert('Reel created! Download will start automatically.');
            } else {
                alert('Error creating reel');
            }
        });

        // Load sounds
        async function loadSounds() {
            const response = await fetch('/api/sounds');
            const sounds = await response.json();

            const list = document.getElementById('soundList');
            const select = document.getElementById('soundSelect');

            if (sounds.length === 0) {
                list.innerHTML = '<p style="color: #666;">No sounds yet. Add your first sound above!</p>';
                return;
            }

            list.innerHTML = sounds.map(sound => `
                <div class="sound-card">
                    <h3>${sound.name}</h3>
                    <p>${sound.artist || 'Unknown artist'}</p>
                    ${sound.url ? `<a href="${sound.url}" target="_blank">Preview</a>` : ''}
                </div>
            `).join('');

            select.innerHTML = '<option value="">Select a sound...</option>' +
                sounds.map(sound => `<option value="${sound.id}">${sound.name}</option>`).join('');
        }
    </script>
</body>
</html>
    '''


@app.route('/api/sounds', methods=['GET'])
def get_sounds():
    """Get all sounds"""
    sounds = []
    sounds_dir = Path(SOUNDS_DIR)

    for sound_file in sounds_dir.glob("*.json"):
        with open(sound_file, 'r') as f:
            sounds.append(json.load(f))

    return jsonify(sounds)


@app.route('/api/sounds', methods=['POST'])
def add_sound():
    """Add a new sound"""
    name = request.form.get('name')
    artist = request.form.get('artist', '')
    url = request.form.get('url', '')
    file = request.files.get('file')

    if not name:
        return jsonify({'error': 'Name is required'}), 400

    # Save audio file if uploaded
    audio_path = None
    if file:
        audio_path = SOUNDS_DIR / f"{name}_{file.filename}"
        file.save(audio_path)

    # Save sound metadata
    sound_data = {
        'id': f"{name}_{len(list(SOUNDS_DIR.glob('*.json')))}",
        'name': name,
        'artist': artist,
        'url': url,
        'audio_path': str(audio_path) if audio_path else None
    }

    sound_file = SOUNDS_DIR / f"{name}.json"
    with open(sound_file, 'w') as f:
        json.dump(sound_data, f, indent=2)

    return jsonify({'success': True, 'sound': sound_data})


@app.route('/api/create-reel', methods=['POST'])
def create_reel():
    """Create a reel with sound"""
    import tempfile

    sound_id = request.form.get('sound_id')
    video_file = request.files.get('video')

    if not sound_id or not video_file:
        return jsonify({'error': 'Missing sound_id or video'}), 400

    # Load sound data
    sound_file = SOUNDS_DIR / f"{sound_id.split('_')[0]}.json"
    if not sound_file.exists():
        return jsonify({'error': 'Sound not found'}), 404

    with open(sound_file, 'r') as f:
        sound = json.load(f)

    # Save uploaded video
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_video:
        video_file.save(tmp_video.name)
        video_path = tmp_video.name

    # Mix audio with video
    if sound.get('audio_path'):
        # Local audio file
        output = create_reel_with_sound(video_path, sound['audio_path'])
    elif sound.get('url'):
        # URL (Spotify preview, etc.)
        output = processor.download_audio_from_url(sound['url'])
        if output:
            output = create_reel_with_sound(video_path, output)
    else:
        return jsonify({'error': 'No audio source available'}), 400

    if output and os.path.exists(output):
        return send_file(output, mimetype='video/mp4', as_attachment=True, download_name='reel_with_sound.mp4')
    else:
        return jsonify({'error': 'Failed to create reel'}), 500


if __name__ == '__main__':
    print("\n🎵 Instagram Sound Manager")
    print("=" * 50)
    print("\nStarting server on http://localhost:5500")
    print("\nOpen this URL in your browser to manage sounds!")
    print("\n" + "=" * 50)

    app.run(host='0.0.0.0', port=5500, debug=True)
