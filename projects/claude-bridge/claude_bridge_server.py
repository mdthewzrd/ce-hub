#!/usr/bin/env python3
import os, time, json, subprocess, hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv(os.path.expanduser("~/.claude-bridge/.env"))

# ---- Config ----
PORT = int(os.getenv("PORT", "8008"))
HOST = os.getenv("HOST", "0.0.0.0")
TMUX_SESSION = os.getenv("TMUX_SESSION", "claude")
STATE_DIR = Path(os.path.expandvars(os.getenv("STATE_DIR", "$HOME/.claude-bridge/jobs")))
LOG_DIR = Path(os.path.expandvars(os.getenv("LOG_DIR", "$HOME/.claude-bridge/logs")))

# Ensure directories exist
STATE_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)

# ---- Models ----
class SendReq(BaseModel):
    text: str
    mode: Optional[str] = "ask"
    workdir: Optional[str] = None
    id: Optional[str] = None
    wait_ms: Optional[int] = 2000
    model: Optional[str] = None

class ModelSwitchReq(BaseModel):
    model: str
    api_key: Optional[str] = None

# ---- FastAPI App ----
app = FastAPI(title="Claude Bridge Server")

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent

# ---- Helper Functions ----
def _now_iso():
    return datetime.now(timezone.utc).isoformat()

def _log(event: str, **kwargs):
    log_entry = {
        "timestamp": _now_iso(),
        "event": event,
        **kwargs
    }
    log_file = LOG_DIR / "bridge.log"
    with open(log_file, "a") as f:
        f.write(json.dumps(log_entry) + "\n")

def _tmux_send(keys):
    """Send keys to tmux session"""
    try:
        subprocess.run([
            "tmux", "send-keys", "-t", TMUX_SESSION, keys
        ], check=True, capture_output=True)
    except subprocess.CalledProcessError as e:
        _log(event="tmux_send_error", error=str(e), keys=keys)
        raise HTTPException(status_code=500, detail=f"tmux error: {e}")

def _tmux_capture(max_lines: int = 1000) -> str:
    """Capture tmux pane content"""
    try:
        result = subprocess.run([
            "tmux", "capture-pane", "-t", TMUX_SESSION, "-p", "-S", f"-{max_lines}"
        ], check=True, capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        _log(event="tmux_capture_error", error=str(e))
        raise HTTPException(status_code=500, detail=f"tmux capture error: {e}")

def handle_chat_request(req, req_id):
    """Handle chat requests with AI models"""
    try:
        # Use model from request if provided, otherwise get from config
        if req.model:
            current_model = req.model
            # For GLM models, get API key from config
            api_key = "05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY" if current_model.startswith("glm") else None
        else:
            # Fallback to stored model config
            model_file = STATE_DIR / "current_model.json"
            current_model = "claude-3-haiku-20240307"  # default
            api_key = None

            if model_file.exists():
                try:
                    with open(model_file, "r") as f:
                        model_data = json.load(f)
                        current_model = model_data.get("model", current_model)
                        api_key = model_data.get("api_key")
                except:
                    pass

        # Make API call based on model type
        if current_model.startswith("glm"):
            response_text = call_glm_api(req.text, current_model, api_key)
        else:
            response_text = call_claude_api(req.text, current_model)

        return {
            "id": req_id,
            "status": "completed",
            "preview": response_text[:200] + "..." if len(response_text) > 200 else response_text,
            "full_response": response_text,
            "model_used": current_model,
            "mobile_context": True,
            "timestamp": _now_iso()
        }

    except Exception as e:
        _log(event="chat_error", error=str(e), id=req_id)
        return {
            "id": req_id,
            "status": "error",
            "error": str(e),
            "full_response": f"Sorry, I encountered an error: {str(e)}",
            "timestamp": _now_iso()
        }

def call_glm_api(message, model, api_key):
    """Call GLM API through z.ai"""
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        data = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": message
                }
            ],
            "stream": False
        }

        response = requests.post(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            error_text = response.text
            if "余额不足" in error_text or "1113" in error_text:
                return f"💳 GLM API Billing Issue: This API key is configured for credit-based billing but has insufficient credits. You have two options:\n\n1. 🔄 Switch to a subscription-based API key (like Claude Pro vs Claude API)\n2. 💰 Add credits to this pay-per-use API key\n\nYour message: '{message}'\n\nℹ️ Try the Claude models for working AI responses while you configure GLM billing!"
            elif "模型不存在" in error_text or "1211" in error_text:
                return f"Hello! I'm GLM-4, but the specific model requested isn't available on this API key. Your message was: '{message}'. Please try the Claude endpoints for working AI responses, or contact the administrator to update the GLM model configuration."
            return f"GLM API Error: {response.status_code} - {response.text}"

    except Exception as e:
        return f"GLM API Error: {str(e)}"

def call_claude_api(message, model):
    """Call Claude API"""
    try:
        # Get API key from environment or config
        anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")

        # If no env key, try to get from current directory config
        if not anthropic_api_key:
            config_file = SCRIPT_DIR / "claude_api_key.txt"
            if config_file.exists():
                anthropic_api_key = config_file.read_text().strip()

        if not anthropic_api_key:
            return f"I'd be happy to help! However, I need a Claude API key to respond. Please add your Anthropic API key to 'claude_api_key.txt' or set the ANTHROPIC_API_KEY environment variable. Your question was: {message}"

        headers = {
            "x-api-key": anthropic_api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        data = {
            "model": model,
            "max_tokens": 2000,
            "messages": [
                {
                    "role": "user",
                    "content": message
                }
            ]
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            return result["content"][0]["text"]
        else:
            return f"Claude API Error ({response.status_code}): {response.text[:200]}..."

    except Exception as e:
        return f"Claude API Error: {str(e)}"

# ---- Endpoints ----
@app.get("/healthz")
def healthz():
    """Health check endpoint"""
    try:
        # Check if tmux session exists
        result = subprocess.run([
            "tmux", "list-sessions", "-F", "#{session_name}"
        ], capture_output=True, text=True)

        # Get current model info
        model_file = STATE_DIR / "current_model.json"
        current_model = "claude-3-haiku-20240307"  # default
        if model_file.exists():
            try:
                with open(model_file, "r") as f:
                    model_data = json.load(f)
                    current_model = model_data.get("model", current_model)
            except:
                pass

        if TMUX_SESSION in result.stdout:
            return {
                "ok": True,
                "tmux_target": f"{TMUX_SESSION}:0.0",
                "tmux_status": "active",
                "model_management": "active",
                "current_model": current_model
            }
        else:
            return {"ok": False, "error": "tmux session not found"}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@app.post("/send")
def send(req: SendReq):
    req_id = req.id or hashlib.sha1((req.text+_now_iso()).encode()).hexdigest()[:12]
    _log(event="accept", id=req_id, mode=req.mode, workdir=req.workdir, n_chars=len(req.text))

    # Check if this is chat mode
    if req.mode == "chat":
        # For chat mode, use the AI model directly
        return handle_chat_request(req, req_id)
    else:
        # For terminal mode, send to tmux as before
        command_text = req.text.strip()
        if command_text:
            _tmux_send(command_text)
        _tmux_send("C-m")  # Send Enter key to submit the message to Claude

    time.sleep((req.wait_ms or 2000)/1000.0)
    pane = _tmux_capture(1000)
    snippet = pane.strip()  # Just capture the pane content
    (STATE_DIR / f"{req_id}.txt").write_text(snippet)
    _log(event="delivered", id=req_id, n_lines=len(snippet.splitlines()))
    return {"id": req_id, "status": "accepted", "preview": snippet[-2000:]}

@app.get("/jobs/{req_id}/tail")
def tail(req_id: str, lines: int = 400):
    p = STATE_DIR / f"{req_id}.txt"
    if not p.exists():
        return JSONResponse({"error":"unknown id"}, status_code=404)
    text = p.read_text()
    return PlainTextResponse("\n".join(text.splitlines()[-lines:]))


@app.get("/jobs/{req_id}/live")
def live_view(req_id: str):
    """Live updating HTML view of the job"""
    # Always capture fresh content from tmux instead of using stored file
    try:
        text = _tmux_capture(1000)
    except Exception as e:
        _log(event="live_view_error", id=req_id, error=str(e))
        return JSONResponse({"error": "Failed to capture tmux content"}, status_code=500)
    
    # Create HTML with auto-refresh
    html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Claude Bridge - Live View</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            background: #1a1a1a;
            color: #e0e0e0;
            margin: 0;
            padding: 0;
            line-height: 1.4;
        }}
        .container {{
            width: 100%;
            margin: 0;
        }}
        .header {{
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 1000;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2a2a2a;
            padding: 12px 20px;
            border-bottom: 1px solid #4CAF50;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }}
        .header-left {{
            display: flex;
            flex-direction: column;
            gap: 2px;
        }}
        .content {{
            background: #0d1117;
            padding: 15px;
            border: none;
            white-space: pre-wrap;
            font-size: 14px;
            margin-top: 80px;
            min-height: calc(100vh - 100px);
            max-height: calc(100vh - 100px);
            overflow-y: auto;
            width: 100%;
            box-sizing: border-box;
        }}
        .status {{
            color: #4CAF50;
            font-weight: bold;
        }}
        .timestamp {{
            color: #888;
            font-size: 12px;
        }}
        .refresh-btn {{
            background: #4CAF50;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            white-space: nowrap;
        }}
        .refresh-btn:hover {{
            background: #45a049;
        }}
    </style>
    <script>
        // Auto-scroll to bottom function
        function scrollToBottom() {{
            const content = document.querySelector('.content');
            if (content) {{
                // Force scroll to absolute bottom
                content.scrollTop = content.scrollHeight;
                // Also try scrolling the window as backup
                window.scrollTo(0, document.body.scrollHeight);
            }}
        }}
        
        // Auto-scroll to bottom on load
        window.addEventListener('load', function() {{
            setTimeout(scrollToBottom, 200);
        }});
        
        // Auto-scroll to bottom when page becomes visible (after refresh)
        document.addEventListener('visibilitychange', function() {{
            if (!document.hidden) {{
                setTimeout(scrollToBottom, 200);
            }}
        }});
        
        // Also try scrolling after a short delay to ensure content is rendered
        setTimeout(scrollToBottom, 500);
        
        // Manual refresh function
        function refreshPage() {{
            window.location.reload();
        }}
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-left">
            <div class="status">🟢 Claude Bridge</div>
            <div class="timestamp">Last updated: {datetime.now().strftime('%H:%M:%S')}</div>
            </div>
            <button class="refresh-btn" onclick="refreshPage()">🔄 Refresh</button>
        </div>
        <div class="content">{text}</div>
    </div>
</body>
</html>
"""
    
    return HTMLResponse(html)

@app.post("/switch-model")
def switch_model(req: ModelSwitchReq):
    """Switch AI model for future commands"""
    try:
        # Store current model info
        model_file = STATE_DIR / "current_model.json"
        model_info = {
            "model": req.model,
            "api_key": req.api_key,
            "timestamp": _now_iso(),
            "provider": "z.ai" if req.model.startswith("glm") else "anthropic"
        }

        with open(model_file, "w") as f:
            json.dump(model_info, f)

        _log(event="model_switch", model=req.model, provider=model_info["provider"])

        return {
            "success": True,
            "model": req.model,
            "provider": model_info["provider"],
            "timestamp": model_info["timestamp"]
        }
    except Exception as e:
        _log(event="model_switch_error", error=str(e), model=req.model)
        return {"success": False, "error": str(e)}

@app.get("/mobile")
def mobile_interface():
    """Serve mobile interface"""
    mobile_file = SCRIPT_DIR / "mobile_interface.html"
    if mobile_file.exists():
        return HTMLResponse(mobile_file.read_text())
    else:
        return HTMLResponse("<h1>Mobile interface not found</h1>", status_code=404)

@app.get("/")
def enhanced_mobile():
    """Serve enhanced mobile interface with model selection"""
    enhanced_file = SCRIPT_DIR / "enhanced_mobile.html"
    if enhanced_file.exists():
        return HTMLResponse(enhanced_file.read_text())
    else:
        # Fallback to simple interface
        simple_file = SCRIPT_DIR / "simple_mobile.html"
        if simple_file.exists():
            return HTMLResponse(simple_file.read_text())
        else:
            return HTMLResponse("<h1>Mobile interface not found</h1>", status_code=404)

@app.get("/chat")
def chat_interface():
    """Serve new clean chat interface"""
    chat_file = SCRIPT_DIR / "new_chat.html"
    if chat_file.exists():
        return HTMLResponse(chat_file.read_text())
    else:
        return HTMLResponse("<h1>Chat interface not found</h1>", status_code=404)

@app.get("/glm4.5chat")
def glm45_chat():
    """GLM 4.5 dedicated chat interface"""
    return create_dedicated_chat("GLM 4.5 Chat", "glm-4-0520", "#4CAF50")

@app.get("/claude4chat")
def claude4_chat():
    """Claude 4 dedicated chat interface"""
    return create_dedicated_chat("Claude 4 Chat", "claude-3-5-sonnet-20241022", "#FF6B35")

@app.get("/glm46chat")
def glm46_chat():
    """GLM 4.6 dedicated chat interface"""
    return create_dedicated_chat("GLM 4.6 Chat", "glm-4-plus", "#2196F3")

@app.get("/mobile-vscode")
def mobile_vscode_wrapper():
    """Serve mobile VS Code wrapper interface"""
    mobile_wrapper_file = SCRIPT_DIR / "mobile_vscode_wrapper.html"
    if mobile_wrapper_file.exists():
        return HTMLResponse(mobile_wrapper_file.read_text())
    else:
        return HTMLResponse("<h1>Mobile VS Code wrapper not found</h1>", status_code=404)

def create_dedicated_chat(title, model, color):
    """Create a dedicated chat interface for a specific model"""
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>{title}</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="{title}">
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Arial, sans-serif;
            background: #0d1117;
            color: #c9d1d9; height: 100vh; overflow: hidden;
        }}
        .header {{
            background: #161b22;
            padding: 20px; text-align: center;
            border-bottom: 1px solid #30363d;
        }}
        .title {{ font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #f0f6fc; }}
        .model-info {{ font-size: 14px; opacity: 0.9; background: #21262d;
                       padding: 4px 12px; border-radius: 12px; display: inline-block; border: 1px solid #30363d; }}
        .chat-container {{
            height: calc(100vh - 140px); overflow-y: auto;
            padding: 20px; display: flex; flex-direction: column; gap: 15px;
        }}
        .message {{ animation: fadeIn 0.3s ease-in; }}
        .user-message {{ text-align: right; }}
        .user-message .bubble {{
            background: #238636; color: white;
            padding: 14px 18px; border-radius: 22px 22px 6px 22px;
            display: inline-block; max-width: 85%;
            font-size: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }}
        .ai-message {{ text-align: left; }}
        .ai-message .bubble {{
            background: #21262d; color: #c9d1d9;
            border: 1px solid #30363d;
            padding: 14px 18px; border-radius: 22px 22px 22px 6px;
            display: inline-block; max-width: 85%;
            font-size: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }}
        .input-area {{
            position: fixed; bottom: 0; left: 0; right: 0;
            background: #161b22; padding: 20px;
            display: flex; gap: 12px;
            border-top: 1px solid #30363d;
        }}
        .input-field {{
            flex: 1; background: #0d1117;
            border: 1px solid #30363d; padding: 14px 18px;
            border-radius: 25px; color: #c9d1d9; font-size: 16px;
            outline: none;
        }}
        .input-field::placeholder {{ color: #7d8590; }}
        .input-field:focus {{
            border-color: #58a6ff;
            box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
        }}
        .send-button {{
            background: #238636; border: none; width: 52px; height: 52px;
            border-radius: 26px; color: white; font-size: 20px;
            cursor: pointer; display: flex; align-items: center;
            justify-content: center; transition: all 0.2s;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }}
        .send-button:hover {{ background: #2ea043; transform: scale(1.05); }}
        .send-button:disabled {{ opacity: 0.5; transform: none; background: #30363d; }}
        .typing {{
            display: none; text-align: center; padding: 15px;
            color: #7d8590; font-style: italic;
        }}
        .typing.show {{ display: block; }}
        @keyframes fadeIn {{ from {{ opacity: 0; transform: translateY(10px); }} to {{ opacity: 1; transform: translateY(0); }} }}
        .welcome {{ text-align: center; padding: 30px 20px; opacity: 0.8; color: #7d8590; }}
        .welcome-icon {{ font-size: 48px; margin-bottom: 15px; }}
    </style>
</head>
<body>
    <div class="header">
        <div class="title">{title}</div>
        <div class="model-info">Model: {model}</div>
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="welcome">
            <div class="welcome-icon">🤖</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Hello! I'm your {title.replace(" Chat", "")} assistant.</div>
            <div style="font-size: 14px; opacity: 0.9;">Ask me anything! I'm here to help with coding, questions, or conversation.</div>
        </div>
    </div>

    <div class="typing" id="typing">AI is thinking...</div>

    <div class="input-area">
        <input type="text" class="input-field" id="messageInput"
               placeholder="Ask me anything..." autocomplete="off">
        <button class="send-button" id="sendButton">→</button>
    </div>

    <script>
        const API_BASE = window.location.origin;
        const TOKEN = '171158e5e011bb1d3e50a387a8234d60871323ce9463ec1ff4a1194cd686cfb4';
        const GLM_API_KEY = '05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY';
        const MODEL = '{model}';

        document.addEventListener('DOMContentLoaded', function() {{
            const input = document.getElementById('messageInput');
            const sendBtn = document.getElementById('sendButton');

            input.addEventListener('keypress', function(e) {{
                if (e.key === 'Enter') sendMessage();
            }});
            sendBtn.addEventListener('click', sendMessage);

            // Set model on page load
            setModel();
            input.focus();
        }});

        async function setModel() {{
            try {{
                await fetch(`${{API_BASE}}/switch-model`, {{
                    method: 'POST',
                    headers: {{
                        'Authorization': `Bearer ${{TOKEN}}`,
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify({{
                        model: MODEL,
                        api_key: MODEL.includes('glm') ? GLM_API_KEY : null
                    }})
                }});
            }} catch (error) {{ console.log('Model switch error:', error); }}
        }}

        async function sendMessage() {{
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;

            addUserMessage(message);
            input.value = '';
            showTyping(true);

            try {{
                const response = await fetch(`${{API_BASE}}/send`, {{
                    method: 'POST',
                    headers: {{
                        'Authorization': `Bearer ${{TOKEN}}`,
                        'Content-Type': 'application/json'
                    }},
                    body: JSON.stringify({{
                        text: message, mode: 'chat', wait_ms: 5000, model: MODEL
                    }})
                }});

                showTyping(false);
                if (response.ok) {{
                    const data = await response.json();
                    const aiResponse = data.full_response || data.preview || 'Sorry, no response available.';
                    addAIMessage(aiResponse);
                }} else {{
                    addAIMessage('❌ Sorry, I encountered an error. Please try again.');
                }}
            }} catch (error) {{
                showTyping(false);
                addAIMessage('❌ Network error. Please check your connection.');
            }}
        }}

        function addUserMessage(text) {{
            const container = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message user-message';
            messageDiv.innerHTML = `<div class="bubble">${{escapeHtml(text)}}</div>`;
            container.appendChild(messageDiv);
            scrollToBottom();
        }}

        function addAIMessage(text) {{
            const container = document.getElementById('chatContainer');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message ai-message';
            messageDiv.innerHTML = `<div class="bubble">${{escapeHtml(text)}}</div>`;
            container.appendChild(messageDiv);
            scrollToBottom();
        }}

        function showTyping(show) {{
            document.getElementById('typing').className = show ? 'typing show' : 'typing';
            if (show) scrollToBottom();
        }}

        function scrollToBottom() {{
            const container = document.getElementById('chatContainer');
            container.scrollTop = container.scrollHeight;
        }}

        function escapeHtml(text) {{
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }}
    </script>
</body>
</html>'''
    return HTMLResponse(html)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
