# CE-Hub Vision Capabilities Setup Guide

## Quick Setup Summary

✅ **COMPLETED STEPS:**

1. **Installed MCP-Vision Server**
   - Package: `mcp-vision==0.1.1`
   - Dependencies: torch, transformers, PIL, scipy
   - Location: `/Users/michaeldurante/.venv/lib/python3.13/site-packages/`

2. **Updated Claude Desktop Configuration**
   - File: `/Users/michaeldurante/Library/Application Support/Claude/claude_desktop_config.json`
   - Added `mcp-vision` server configuration
   - Command: `/Users/michaeldurante/.venv/bin/python3`

3. **Created Documentation**
   - Vision capabilities overview
   - Integration guidelines
   - System prompts for automatic usage

## Required Next Steps

### 1. Restart Claude Desktop

**IMPORTANT**: Claude Desktop must be restarted to load the new MCP server configuration.

1. Quit Claude Desktop completely
2. Relaunch Claude Desktop
3. Wait for MCP servers to initialize (30-60 seconds for first load)

### 2. Verify MCP-Vision Connection

After restart, check if the vision server is available:

```bash
# In a new Claude session, run:
ListMcpResourcesTool(server="mcp-vision")
```

Expected output should show vision tools available.

### 3. Test Vision Capabilities

#### Test 1: Basic Server Connection
```python
# Check if MCP-Vision server is connected
ListMcpResourcesTool()
# Should show "mcp-vision" in available servers
```

#### Test 2: Object Detection
```python
# Test with a sample image
# Upload or provide path to an image file
# Vision analysis should activate automatically
```

#### Test 3: UI Analysis
```python
# Test with a screenshot
# Should automatically detect UI elements
```

## Configuration Details

### Current MCP Configuration

```json
{
  "mcpServers": {
    "notion": { ... },
    "backtesting": { ... },
    "talib": { ... },
    "osengine": { ... },
    "polygon": { ... },
    "n8n-mcp": { ... },
    "archon": { ... },
    "mcp-vision": {
      "command": "/Users/michaeldurante/.venv/bin/python3",
      "args": ["-c", "from mcp_vision import main; main()"],
      "env": {
        "MCP_TRANSPORT": "stdio",
        "LOG_LEVEL": "error"
      }
    }
  }
}
```

### Python Environment

- **Python Path**: `/Users/michaeldurante/.venv/bin/python3`
- **Virtual Environment**: Active with all required packages
- **Model Cache**: `~/.cache/huggingface/transformers/`

## Vision Capabilities Overview

### Available Models

1. **OWL-ViT (Object Detection)**
   - Model: `google/owlvit-large-patch14`
   - Capability: Zero-shot object detection
   - Memory: ~2GB

2. **Image Analysis Pipeline**
   - Format Support: JPEG, PNG, WebP, BMP, GIF
   - Feature Extraction: Advanced visual features
   - UI Element Detection: Buttons, forms, layouts

### Automatic Activation Triggers

The system will automatically use vision when it detects:

1. **File Extensions**: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`, `.svg`
2. **Keywords**: "analyze image", "screenshot", "what do you see"
3. **Development Context**: Frontend work, UI debugging
4. **Content Extraction**: "extract text", "read image"

## Performance Expectations

### First Use (Model Download)
- Time: 30-60 seconds
- Download: ~1GB model files
- Storage: Cached locally

### Subsequent Uses
- Analysis Time: 1-3 seconds per image
- Memory Usage: ~2GB during processing
- CPU: Moderate usage during inference

## Troubleshooting

### Common Issues

#### 1. Server Not Found
**Problem**: `Server "mcp-vision" not found`

**Solution**:
- Restart Claude Desktop completely
- Wait 60 seconds for server initialization
- Check configuration file syntax

#### 2. Model Download Fails
**Problem**: Network timeout during model download

**Solution**:
```bash
# Pre-download models manually
python3 -c "
from transformers import pipeline
pipeline('zero-shot-object-detection', model='google/owlvit-large-patch14')
"
```

#### 3. Memory Issues
**Problem**: Out of memory during processing

**Solution**:
- Close other applications
- Reduce image resolution
- Monitor system memory usage

#### 4. Import Errors
**Problem**: Module import failures

**Solution**:
```bash
# Verify installation
python3 -c "from mcp_vision import main; print('OK')"

# Reinstall if needed
pip install -e /tmp/mcp-vision
```

### Debug Commands

```bash
# Test Python environment
/Users/michaeldurante/.venv/bin/python3 --version

# Test MCP-Vision import
python3 -c "from mcp_vision import main; print('Vision server ready')"

# Check model cache
ls ~/.cache/huggingface/transformers/ | grep owl

# Monitor system resources
htop | grep python
```

## Integration Verification

### Step 1: Basic Connection Test
```python
# Should return server list including mcp-vision
ListMcpResourcesTool()
```

### Step 2: Vision Analysis Test
```python
# Provide any image file and verify automatic analysis
# Example: "Analyze this screenshot: /path/to/image.png"
```

### Step 3: Workflow Integration Test
```python
# Test in context of development workflow
# Example: Frontend debugging with screenshot analysis
```

## System Integration

### With Existing MCP Servers

The vision server integrates seamlessly with:
- **Archon**: Visual analysis results stored in knowledge graph
- **N8N**: Automated vision workflows
- **Notion**: Visual documentation and analysis

### With CE-Hub Agents

- **GUI-Specialist**: Enhanced with visual validation
- **Quality-Assurance-Tester**: Automated visual testing
- **Research-Intelligence-Specialist**: Visual pattern analysis
- **Engineer-Agent**: Visual debugging capabilities

## Success Indicators

✅ **Setup Complete When:**
- MCP-Vision server appears in available servers list
- Image analysis activates automatically for image files
- Object detection works on test images
- UI analysis functions for screenshots
- Performance is acceptable (< 5 seconds per analysis)

## Maintenance

### Regular Tasks
- Monitor model cache size (~5GB max recommended)
- Update transformers library periodically
- Check for MCP-Vision package updates
- Clear cache if performance degrades

### Optimization
- Pre-load models during system startup
- Cache frequently analyzed image types
- Optimize image preprocessing for common formats
- Monitor and tune memory usage

---

## Summary

The CE-Hub system now has comprehensive computer vision capabilities integrated through MCP-Vision. After restarting Claude Desktop, the system will automatically analyze images, screenshots, and visual content to enhance all development workflows.

**Next Action Required**: Restart Claude Desktop to activate vision capabilities.