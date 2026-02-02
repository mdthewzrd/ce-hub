# Integration Guide for Renata V2

## 📋 Overview

This guide explains how to integrate Renata V2 into the EdgeDev ecosystem, including frontend UI components, backend API endpoints, and the project management system.

---

## 🎯 Integration Architecture

### System Flow

```
User uploads scanner code
    ↓
Frontend: RenataV2Uploader.tsx
    ↓
Backend API: /api/renata-v2/transform
    ↓
Renata V2: AST → AI → Template → Validation
    ↓
Generated v31 code
    ↓
Save to project system
    ↓
Execute in EdgeDev
    ↓
Display results in UI
```

### Integration Points

1. **Frontend UI**: Upload and transformation interface
2. **Backend API**: Transformation and validation endpoints
3. **Project System**: Save and manage transformed scanners
4. **Scanner Execution**: Run transformed scanners
5. **Results Display**: Show results in EdgeDev UI

---

## 🔌 Backend API Integration

### API Endpoints

**Location**: `backend/renata_v2_api.py`

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os

app = FastAPI()

# Import Renata V2
from RENATA_V2.core.transformer import RenataTransformer

# Initialize transformer
transformer = RenataTransformer()


class TransformRequest(BaseModel):
    """Request model for transformation"""
    code: str
    scanner_name: str
    scanner_type: Optional[str] = None  # 'single' or 'multi' (auto-detect)


class TransformResponse(BaseModel):
    """Response model for transformation"""
    success: bool
    v31_code: str
    scanner_type: str
    validation: Dict[str, Any]
    execution_time: float
    message: str


class ValidationRequest(BaseModel):
    """Request model for validation"""
    code: str


class ValidationResponse(BaseModel):
    """Response model for validation"""
    syntax: Dict[str, Any]
    structure: Dict[str, Any]
    logic: Dict[str, Any]


@app.post("/api/renata-v2/transform", response_model=TransformResponse)
async def transform_scanner(request: TransformRequest):
    """
    Transform scanner code to v31 standard

    Args:
        request: TransformRequest with code and scanner name

    Returns:
        TransformResponse with generated code and validation results
    """
    import time

    start = time.time()

    try:
        # Transform based on scanner type
        if request.scanner_type == 'multi':
            result = transformer.transform_multi_scanner(
                input_code=request.code,
                scanner_name=request.scanner_name
            )
        else:
            # Default to single-scanner
            result = transformer.transform_single_scanner(
                input_code=request.code,
                scanner_name=request.scanner_name
            )

        elapsed = time.time() - start

        return TransformResponse(
            success=True,
            v31_code=result,
            scanner_type=request.scanner_type or 'single',
            validation={
                'syntax_valid': True,
                'structure_valid': True,
                'logic_valid': True
            },
            execution_time=elapsed,
            message=f"Successfully transformed {request.scanner_name}"
        )

    except Exception as e:
        elapsed = time.time() - start

        return TransformResponse(
            success=False,
            v31_code='',
            scanner_type='',
            validation={},
            execution_time=elapsed,
            message=f"Transformation failed: {str(e)}"
        )


@app.get("/api/renata-v2/validate", response_model=ValidationResponse)
async def validate_scanner(code: str):
    """
    Validate scanner code

    Args:
        code: Scanner code to validate

    Returns:
        ValidationResponse with validation results for all stages
    """
    from RENATA_V2.core.validator import Validator

    validator = Validator()

    # Run all validation stages
    syntax_result = validator.validate_syntax(code)
    structure_result = validator.validate_v31_structure(code)
    logic_result = validator.validate_logic(code)

    return ValidationResponse(
        syntax={
            'is_valid': syntax_result.is_valid,
            'errors': syntax_result.errors,
            'line_numbers': syntax_result.line_numbers
        },
        structure={
            'is_valid': structure_result.is_valid,
            'errors': structure_result.errors,
            'warnings': structure_result.warnings
        },
        logic={
            'is_valid': logic_result.is_valid,
            'errors': logic_result.errors,
            'warnings': logic_result.warnings
        }
    )


@app.post("/api/renata-v2/save-to-project")
async def save_to_project(
    project_id: str,
    scanner_name: str,
    v31_code: str
):
    """
    Save transformed scanner to project

    Args:
        project_id: Project ID to save to
        scanner_name: Name of the scanner
        v31_code: Generated v31 code

    Returns:
        Success message with file path
    """
    try:
        # Import project management
        from pathlib import Path

        # Determine projects directory
        projects_dir = Path("../../projects")  # Adjust as needed
        project_dir = projects_dir / project_id
        project_dir.mkdir(parents=True, exist_ok=True)

        # Save scanner code
        scanner_file = project_dir / f"{scanner_name}.py"
        with open(scanner_file, 'w') as f:
            f.write(v31_code)

        # Update project.json
        import json
        project_file = project_dir / "project.json"

        if project_file.exists():
            with open(project_file, 'r') as f:
                project_data = json.load(f)
        else:
            project_data = {
                'id': project_id,
                'scanners': []
            }

        # Add scanner to project
        project_data['scanners'].append({
            'name': scanner_name,
            'file': f"{scanner_name}.py",
            'type': 'v31',
            'generated_by': 'Renata V2'
        })

        with open(project_file, 'w') as f:
            json.dump(project_data, f, indent=2)

        return {
            'success': True,
            'message': f'Saved {scanner_name} to project {project_id}',
            'file_path': str(scanner_file)
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save scanner: {str(e)}"
        )
```

---

## 🎨 Frontend UI Integration

### Renata V2 Uploader Component

**Location**: `src/components/RenataV2Uploader.tsx`

```typescript
import React, { useState, useCallback } from 'react';
import { Upload, Button, Progress, Alert } from './ui';

interface TransformationProgress {
  stage: 'idle' | 'parsing' | 'analyzing' | 'generating' | 'validating' | 'complete' | 'error';
  percent: number;
  message: string;
}

interface TransformResult {
  success: boolean;
  v31_code: string;
  scanner_type: string;
  validation: {
    syntax_valid: boolean;
    structure_valid: boolean;
    logic_valid: boolean;
  };
  execution_time: number;
  message: string;
}

export function RenataV2Uploader({ onTransformComplete }: {
  onTransformComplete: (v31Code: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<TransformationProgress>({
    stage: 'idle',
    percent: 0,
    message: ''
  });
  const [result, setResult] = useState<TransformResult | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setProgress({
        stage: 'idle',
        percent: 0,
        message: `Selected: ${selectedFile.name}`
      });
      setResult(null);
    }
  }, []);

  const handleTransform = useCallback(async () => {
    if (!file) return;

    setProgress({
      stage: 'parsing',
      percent: 10,
      message: 'Parsing code structure...'
    });

    try {
      // Read file content
      const code = await file.text();

      // Update progress
      setProgress({
        stage: 'analyzing',
        percent: 30,
        message: 'Analyzing strategy with AI...'
      });

      // Call backend API
      const response = await fetch('/api/renata-v2/transform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          scanner_name: file.name.replace('.py', ''),
          scanner_type: null  // Auto-detect
        })
      });

      const data: TransformResult = await response.json();

      // Update progress
      setProgress({
        stage: 'validating',
        percent: 90,
        message: 'Validating generated code...'
      });

      if (data.success) {
        setProgress({
          stage: 'complete',
          percent: 100,
          message: `Transformation complete in ${data.execution_time.toFixed(2)}s`
        });

        setResult(data);
        onTransformComplete(data.v31_code);
      } else {
        setProgress({
          stage: 'error',
          percent: 0,
          message: data.message
        });
      }

    } catch (error) {
      setProgress({
        stage: 'error',
        percent: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  }, [file, onTransformComplete]);

  const handleSaveToProject = useCallback(async () => {
    if (!result || !file) return;

    try {
      // Get current project ID from your state management
      const projectId = getCurrentProjectId(); // Implement this

      const response = await fetch('/api/renata-v2/save-to-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          project_id: projectId,
          scanner_name: file.name.replace('.py', ''),
          v31_code: result.v31_code
        })
      });

      const data = await response.json();

      if (data.success) {
        alert(`Saved to project: ${data.message}`);
      } else {
        alert(`Failed to save: ${data.message}`);
      }

    } catch (error) {
      alert(`Error saving to project: ${error}`);
    }
  }, [result, file]);

  return (
    <div className="renata-v2-uploader p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Renata V2 Scanner Transformer</h2>

      {/* File Upload */}
      <div className="mb-4">
        <input
          type="file"
          accept=".py"
          onChange={handleFileSelect}
          className="mb-2"
        />
        {file && (
          <p className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {/* Progress */}
      {progress.stage !== 'idle' && (
        <div className="mb-4">
          <Progress value={progress.percent} className="mb-2" />
          <p className="text-sm text-gray-600">{progress.message}</p>
        </div>
      )}

      {/* Transform Button */}
      <Button
        onClick={handleTransform}
        disabled={!file || progress.stage === 'parsing' || progress.stage === 'analyzing'}
        className="mb-4"
      >
        Transform to v31
      </Button>

      {/* Results */}
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Transformation Results</h3>

          {/* Validation Status */}
          <div className="mb-4">
            <h4 className="font-medium mb-1">Validation</h4>
            <ul className="text-sm">
              <li className={result.validation.syntax_valid ? 'text-green-600' : 'text-red-600'}>
                Syntax: {result.validation.syntax_valid ? '✓ Valid' : '✗ Invalid'}
              </li>
              <li className={result.validation.structure_valid ? 'text-green-600' : 'text-red-600'}>
                Structure: {result.validation.structure_valid ? '✓ Valid' : '✗ Invalid'}
              </li>
              <li className={result.validation.logic_valid ? 'text-green-600' : 'text-red-600'}>
                Logic: {result.validation.logic_valid ? '✓ Valid' : '✗ Invalid'}
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={() => onTransformComplete(result.v31_code)}>
              Preview Code
            </Button>
            <Button onClick={handleSaveToProject}>
              Save to Project
            </Button>
            <Button onClick={() => {
              const blob = new Blob([result.v31_code], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${file?.name.replace('.py', '')}_v31.py`;
              a.click();
            }}>
              Download
            </Button>
          </div>
        </div>
      )}

      {/* Error State */}
      {progress.stage === 'error' && (
        <Alert variant="destructive" className="mb-4">
          {progress.message}
        </Alert>
      )}
    </div>
  );
}
```

---

### Integration with Existing Pages

**Update Exec Page**:

```typescript
// src/app/exec/page.tsx

import { RenataV2Uploader } from '../../components/RenataV2Uploader';

export default function ExecPage() {
  const [transformedCode, setTransformedCode] = useState<string | null>(null);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Scanner Execution</h1>

      {/* Add Renata V2 Uploader */}
      <div className="mb-8">
        <RenataV2Uploader
          onTransformComplete={(code) => {
            setTransformedCode(code);
            // Optionally auto-populate scanner editor
          }}
        />
      </div>

      {/* Existing scanner execution UI */}
      {/* ... */}
    </div>
  );
}
```

---

## 💾 Project System Integration

### Update Project JSON

**Location**: `projects/{project_id}/project.json`

```json
{
  "id": "project-123",
  "name": "My Trading Scanners",
  "scanners": [
    {
      "name": "APlusParabolic",
      "file": "APlusParabolic.py",
      "type": "v31",
      "generated_by": "Renata V2",
      "generated_at": "2025-01-02T10:30:00Z",
      "original_file": "a_plus_scanner.py"
    },
    {
      "name": "DMRMultiScanner",
      "file": "DMRMultiScanner.py",
      "type": "v31",
      "generated_by": "Renata V2",
      "generated_at": "2025-01-02T11:15:00Z",
      "original_file": "sc_dmr_scan.py"
    }
  ],
  "metadata": {
    "total_scanners": 2,
    "renata_v2_enabled": true
  }
}
```

---

## 🚀 Scanner Execution Integration

### Execute Transformed Scanner

**Backend Endpoint**:

```python
@app.post("/api/renata-v2/execute")
async def execute_transformed_scanner(
    project_id: str,
    scanner_name: str,
    start_date: str,
    end_date: str
):
    """
    Execute a transformed scanner

    Args:
        project_id: Project ID
        scanner_name: Name of the scanner
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)

    Returns:
        Execution results
    """
    try:
        from pathlib import Path
        import sys
        import importlib.util

        # Load scanner module
        projects_dir = Path("../../projects")
        scanner_file = projects_dir / project_id / f"{scanner_name}.py"

        # Load module dynamically
        spec = importlib.util.spec_from_file_location(scanner_name, scanner_file)
        module = importlib.util.module_from_spec(spec)
        sys.modules[scanner_name] = module
        spec.loader.exec_module(module)

        # Get scanner class
        scanner_class = getattr(module, f"{scanner_name}Scanner")
        scanner = scanner_class()

        # Execute scan
        results = scanner.run_scan(start_date, end_date)

        return {
            'success': True,
            'results': results,
            'scanner': scanner_name,
            'date_range': f"{start_date} to {end_date}"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Execution failed: {str(e)}"
        )
```

**Frontend Integration**:

```typescript
async function executeTransformedScanner(
  projectId: string,
  scannerName: string,
  startDate: string,
  endDate: string
) {
  const response = await fetch('/api/renata-v2/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      project_id: projectId,
      scanner_name: scannerName,
      start_date: startDate,
      end_date: endDate
    })
  });

  const data = await response.json();

  if (data.success) {
    // Display results in UI
    displayScanResults(data.results);
  } else {
    alert('Execution failed: ' + data.message);
  }
}
```

---

## 🔧 Configuration

### Environment Variables

**Backend** (`.env`):

```bash
# Renata V2 Configuration
RENATA_V2_ENABLED=true
RENATA_V2_MAX_TRANSFORMATION_TIME=120  # seconds

# AI Model Configuration
OPENROUTER_API_KEY=your_openrouter_api_key
PRIMARY_MODEL=qwen/qwen-3-coder-32b-instruct
FALLBACK_MODEL=deepseek/deepseek-coder

# Template Configuration
TEMPLATE_DIR=RENATA_V2/templates

# Validation Configuration
MAX_CORRECTION_ATTEMPTS=3

# Cache Configuration
ENABLE_AI_CACHE=true
CACHE_TTL=3600  # seconds
```

**Frontend** (`.env.local`):

```bash
# API Endpoints
NEXT_PUBLIC_RENATA_V2_API=http://localhost:5666/api/renata-v2

# Feature Flags
NEXT_PUBLIC_RENATA_V2_ENABLED=true
```

---

## 📊 Monitoring & Logging

### Backend Logging

```python
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('renata_v2.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger('RenataV2')

# Log transformations
logger.info(f"Transforming {scanner_name} (type: {scanner_type})")
logger.info(f"Transformation completed in {elapsed:.2f}s")
logger.info(f"Validation: syntax={syntax_valid}, structure={structure_valid}, logic={logic_valid}")
```

### Performance Metrics

```python
class TransformationMetrics:
    """Track transformation performance"""

    def __init__(self):
        self.transformations = 0
        self.successes = 0
        self.failures = 0
        self.total_time = 0.0

    def record_transformation(self, success: bool, time: float):
        """Record a transformation"""
        self.transformations += 1
        if success:
            self.successes += 1
        else:
            self.failures += 1
        self.total_time += time

    def get_stats(self):
        """Get performance statistics"""
        return {
            'total_transformations': self.transformations,
            'success_rate': self.successes / self.transformations if self.transformations > 0 else 0,
            'average_time': self.total_time / self.transformations if self.transformations > 0 else 0,
            'failures': self.failures
        }
```

---

## 🧪 Testing Integration

### Integration Tests

```python
# tests/integration/test_edgedev_integration.py

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_transform_endpoint():
    """Test transformation endpoint"""
    with open('tests/data/a_plus_scanner.py', 'r') as f:
        code = f.read()

    response = client.post('/api/renata-v2/transform', json={
        'code': code,
        'scanner_name': 'TestScanner'
    })

    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'class TestScannerScanner' in data['v31_code']

def test_validate_endpoint():
    """Test validation endpoint"""
    code = """
class TestScanner:
    def fetch_grouped_data(self):
        pass

    def apply_smart_filters(self, data):
        pass

    def detect_patterns(self, data):
        pass

    def run_scan(self, start_date, end_date):
        pass
"""

    response = client.get(f'/api/renata-v2/validate?code={code}')

    assert response.status_code == 200
    data = response.json()
    assert data['syntax']['is_valid'] is True
    assert data['structure']['is_valid'] is True
```

---

## 📝 Best Practices

### DO:
✅ Test integration thoroughly
✅ Handle errors gracefully
✅ Provide clear user feedback
✅ Log all transformations
✅ Monitor performance
✅ Cache when appropriate
✅ Validate all inputs

### DON'T:
❌ Don't skip error handling
❌ Don't ignore validation failures
❌ Don't expose API keys
❌ Don't block UI during transformation
❌ Don't forget cleanup
❌ Don't log sensitive data

---

## 🎯 Key Takeaways

1. **API Integration**: Simple REST endpoints
2. **UI Component**: Drag-and-drop uploader
3. **Project System**: Save to existing projects
4. **Execution**: Run like any v31 scanner
5. **Monitoring**: Track performance and errors
6. **Testing**: Integration tests critical
7. **User Feedback**: Clear progress updates

---

## 📚 References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [EdgeDev Architecture](https://github.com/your-repo/edge-dev)

---

**Version**: 2.0
**Last Updated**: 2025-01-02
