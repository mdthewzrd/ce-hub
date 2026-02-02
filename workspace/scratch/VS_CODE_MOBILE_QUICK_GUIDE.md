# VS Code on Mobile - Quick Start Guide

**TL;DR**: Use code-server with Tailscale for the best mobile VS Code experience.

---

## Quick Comparison

| Solution | Mobile Score | Setup | Cost | Best For |
|----------|-------------|-------|------|----------|
| **code-server** | 9/10 | Medium | Free | Mobile-first development |
| **GitHub Codespaces** | 4/10 | Easy | $$ | Desktop with occasional mobile |
| **VS Code Tunnels** | 7/10 | Easy | Free | Quick remote access |
| **Remote-SSH** | 2/10 | Medium | Free | Desktop only - avoid for mobile |
| **OpenVSCode Server** | 7/10 | Easy | Free | Lightweight alternative |

---

## Recommended Setup: code-server + Tailscale

### Installation (5 commands)

```bash
# 1. Install code-server
curl -fsSL https://code-server.dev/install.sh | sh

# 2. Install Tailscale
curl -fsSL https://tailscale.com/install.sh | sh

# 3. Connect to Tailscale
sudo tailscale up

# 4. Enable HTTPS serving (do this once at https://login.tailscale.com/f/serve)
tailscale serve --https 8080

# 5. Start code-server
code-server
```

### Access from Mobile

1. Install Tailscale app on your phone (App Store/Google Play)
2. Sign in with same account
3. Open Safari/Chrome
4. Go to `https://[your-machine-name].tail-scale.ts.net`
5. Install as PWA (Add to Home Screen)

### Total Setup Time: 15-30 minutes

---

## What You Get

### Pros
- Full VS Code in your mobile browser
- Install to home screen like a native app
- Access from anywhere with internet
- Secure encrypted connection (no open ports)
- Free for personal use
- Full control over environment
- Works on iPad with keyboard/mouse

### Cons
- Cannot use Microsoft extension marketplace (only Open VSX)
- Some popular extensions missing (GitHub Copilot, Live Share)
- Requires a server (can be your dev machine)
- Claude Code extension support uncertain

---

## Extension Installation

```bash
# Install from Open VSX
code-server --install-extension publisher.extension-name

# Manual .vsix installation
code-server --install-extension path/to/extension.vsix
```

**Available on Open VSX**:
- Most language extensions (Python, JavaScript, Go, etc.)
- Git extensions
- Themes and icons
- Many popular tools

**NOT available**:
- GitHub Copilot
- Remote Development extensions
- Live Share
- Some Microsoft-specific tools

---

## Mobile Optimization Tips

### PWA Installation (iOS)
1. Open in Safari
2. Tap Share button
3. Add to Home Screen
4. Open from home screen

### PWA Installation (Android)
1. Open in Chrome
2. Tap menu (3 dots)
3. Install app
4. Open from app drawer

### Keyboard Shortcuts (PWA mode)
- `cmd+w` - Close file
- `cmd+s` - Save file
- `cmd+p` - Quick open
- `cmd+shift+p` - Command palette

### External Keyboard Recommended
- Bluetooth keyboard for comfortable coding
- iPad with Smart Keyboard works great
- Samsung DeX for desktop-like experience

---

## Troubleshooting

### Can't connect from mobile?
- Check Tailscale is running on both devices
- Verify you enabled "serve" at https://login.tailscale.com/f/serve
- Try accessing via IP: `http://100.x.x.x:8080` (Tailscale IP)

### Extensions won't install?
- Check Open VSX marketplace: https://open-vsx.org
- Download .vsix manually and install via CLI
- Some extensions may not be available

### Slow performance?
- Server needs at least 2GB RAM, 2 vCPUs
- Use SSD storage
- Close unused browser tabs
- Disable unnecessary extensions

### Certificate warnings?
- Use Tailscale HTTPS (recommended)
- Or set up Let's Encrypt with reverse proxy
- Don't use self-signed certs for mobile

---

## Alternative: VS Code Remote Tunnels

If code-server doesn't work for you:

```bash
# Built into VS Code CLI
code tunnel --accept-server-license-terms
```

**Pros**:
- Even easier setup
- Official Microsoft solution
- Better extension compatibility

**Cons**:
- Worse mobile browser experience
- No PWA support
- Limited functionality in browser
- Traffic through Microsoft servers

---

## Cost Breakdown

### Self-Hosted (code-server)
- **Existing machine**: $0/month
- **Cloud server**: $5-10/month (DigitalOcean/Linode)
- **Tailscale**: Free (personal use)
- **Total**: $0-10/month

### GitHub Codespaces
- **Free tier**: 60 hours/month
- **Heavy usage**: $100-200/month
- **Not recommended** for mobile

### VS Code Tunnels
- **Free**: Yes
- **Server needed**: Can use existing machine

---

## For CE-Hub Integration

### Integration Points
1. **claude-bridge server**: Add code-server access endpoint
2. **Agent orchestration**: Access via mobile code-server
3. **Archon knowledge graph**: Query through integrated terminal
4. **Mobile workflows**: Full development environment on phone

### Expected Workflow
```
Mobile Device (code-server PWA)
  ↓ [Tailscale VPN]
Development Machine (code-server)
  ↓ [Claude-Bridge]
CE-Hub Agent Orchestration
  ↓ [Archon-First Protocol]
Knowledge Graph & RAG
```

---

## Resources

- **code-server Docs**: https://coder.com/docs/code-server
- **Tailscale Setup**: https://tailscale.com/kb/1166/vscode-ipad
- **Open VSX Registry**: https://open-vsx.org
- **Full Research Report**: See VS_CODE_REMOTE_MOBILE_RESEARCH.md

---

## Bottom Line

**For mobile VS Code**: code-server + Tailscale is the best solution.

It's the only option that gives you:
- Real PWA support
- Good mobile browser experience
- Secure access without complexity
- Full control over your environment

Setup takes 30 minutes, works great on iPhone/iPad/Android, and is free for personal use.

**Just do it.** You'll have VS Code in your pocket.
