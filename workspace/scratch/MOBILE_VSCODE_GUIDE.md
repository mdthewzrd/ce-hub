# 📱 Mobile VS Code - CE-Hub Quick Reference

Your mobile VS Code setup is now optimized! Here's everything you need to know:

## 🚀 Access Your Mobile IDE

**URL**: https://michaels-macbook-pro-2.tail6d4c6d.ts.net/
**Password**: `9c7516c8dba7b2328e081e31`

### 📲 Install as PWA (Recommended)
1. Open Safari on your iPhone
2. Go to the URL above
3. Tap **Share** button → **"Add to Home Screen"**
4. Open from home screen for native app experience

## 🎨 Mobile Optimizations Applied

### **Visual Enhancements**
- ✅ **Dark+ theme** with enhanced GitHub-style colors
- ✅ **Larger fonts** (18px editor, 16px terminal) for mobile readability
- ✅ **Activity bar at bottom** for easier thumb access
- ✅ **No minimap** to maximize screen space
- ✅ **Single tab mode** to reduce clutter
- ✅ **Compact layout** with optimized spacing

### **Touch-Friendly Interface**
- ✅ **Larger touch targets** (24px tree indentation)
- ✅ **Tab close buttons on left** for easier access
- ✅ **Smooth scrolling** enabled throughout
- ✅ **Enhanced mouse/touch sensitivity**
- ✅ **Auto-save on focus change** (perfect for mobile)

### **Performance Optimizations**
- ✅ **Telemetry disabled** for faster loading
- ✅ **Auto-updates disabled**
- ✅ **Welcome screens disabled**
- ✅ **Editor limit**: 3 tabs max
- ✅ **CE-Hub workspace** pre-loaded

## 📱 Mobile Usage Tips

### **Navigation**
- **Swipe left/right** on editor tabs to switch files
- **Double-tap** tabs to maximize editor
- **Pull down** from top of terminal to show/hide
- **Long press** on files for context menu

### **Keyboard Shortcuts** (with external keyboard)
- `Cmd+P` - Quick file open
- `Cmd+Shift+P` - Command palette
- `Cmd+W` - Close file
- `Cmd+S` - Save file (auto-save already enabled)
- `Cmd+J` - Toggle terminal
- `Cmd+B` - Toggle sidebar

### **Terminal Usage**
- **Font size**: 16px for readability
- **Default shell**: zsh
- **Smooth scrolling** enabled
- **Full CE-Hub environment** available

## 🛠 Management Commands

### **Start Mobile VS Code**
```bash
~/.local/share/code-server/mobile-start.sh
```

### **Check Status**
```bash
# Check if services are running
ps aux | grep -E "(code-server|tailscale serve)"

# Check PIDs
cat /tmp/mobile-vscode-pids.txt
```

### **Stop Services**
```bash
# Stop code-server
pkill -f code-server

# Stop Tailscale serve
pkill -f "tailscale serve"
```

### **View Logs**
```bash
# Code-server logs
tail -f /tmp/code-server-mobile.log

# Tailscale status
tailscale status
```

## 📁 File Locations

### **Global Settings**
```
~/.local/share/code-server/User/settings.json
```

### **Workspace Settings**
```
/Users/michaeldurante/ai dev/ce-hub/.vscode/settings.json
```

### **Extensions**
```
~/.local/share/code-server/extensions/
```

### **Mobile Customizations**
```
~/.local/share/code-server/User/mobile-optimizations.css
~/.local/share/code-server/mobile-start.sh
```

## 🔧 Installed Extensions

- ✅ **Auto Rename Tag** - HTML/JSX tag sync
- ✅ **Tailwind CSS IntelliSense** - Mobile-first CSS
- ✅ **VS-Seti Icons** - Clean file icons

### **Install More Extensions**
```bash
code-server --install-extension publisher.extension-name
```

## 📊 CE-Hub Integration

Your mobile VS Code has full access to:

### **Project Structure**
- 📂 `/Users/michaeldurante/ai dev/ce-hub/` - Main workspace
- 📂 `traderra/` - Trading platform
- 📂 `edge-dev/` - Development tools
- 📂 `docs/` - Documentation
- 📂 `scripts/` - Automation scripts

### **Agent Orchestration**
- 🤖 **Archon MCP** integration via terminal
- 🔄 **Claude-Bridge** connections
- 📈 **Knowledge graph** access
- 🛠 **Agent scripting** from mobile

### **Development Workflow**
1. **Edit code** on mobile with full IDE features
2. **Run commands** in integrated terminal
3. **Test changes** through development servers
4. **Commit via git** with mobile interface

## 🎯 Mobile Development Best Practices

### **Performance**
- Keep **3 tabs max** open at once
- Use **Quick Open** (`Cmd+P`) instead of file explorer
- **Close unused terminals** to save resources
- **Enable Zen Mode** for distraction-free coding

### **Battery Optimization**
- **Dark theme** saves OLED battery
- **Reduce animations** if needed
- **Auto-save** prevents work loss
- **Background app refresh** managed by PWA

### **Workflow Tips**
- **Start with Quick Open** to jump to files
- **Use Command Palette** for all actions
- **Terminal shortcuts** for git operations
- **Split terminals** for multi-tasking

## 🔒 Security Notes

- ✅ **Tailscale VPN** - Zero-trust mesh networking
- ✅ **HTTPS encryption** - All traffic encrypted
- ✅ **No public ports** - Only accessible via Tailscale
- ✅ **Password auth** - Additional security layer
- ✅ **Device control** - Manage access per device

## 🆘 Troubleshooting

### **Can't Connect?**
1. Check Tailscale is running: `tailscale status`
2. Verify code-server is running: `ps aux | grep code-server`
3. Restart services: `~/.local/share/code-server/mobile-start.sh`

### **Slow Performance?**
1. Close unused tabs (max 3 recommended)
2. Clear browser cache
3. Check server resources: `top`
4. Restart code-server if needed

### **Layout Issues?**
1. Try landscape orientation
2. Enable/disable activity bar: `View > Appearance`
3. Reset layout: `View > Appearance > Reset Layout`
4. Zoom level: Browser settings

### **Extensions Not Working?**
1. Check Open VSX availability: https://open-vsx.org
2. Manual install: `code-server --install-extension path/to/file.vsix`
3. Restart code-server after installation

---

## 🎉 You're All Set!

Your mobile VS Code is now optimized for:
- 📱 **Native mobile experience** with PWA
- 🎨 **Beautiful dark interface** with proper contrast
- ⚡ **Fast performance** with mobile optimizations
- 🔧 **Full CE-Hub development** capabilities
- 🔒 **Secure access** via Tailscale VPN

**Enjoy coding on your phone!** 📱✨

---

*Last updated: November 22, 2025*
*CE-Hub Mobile VS Code v1.0*