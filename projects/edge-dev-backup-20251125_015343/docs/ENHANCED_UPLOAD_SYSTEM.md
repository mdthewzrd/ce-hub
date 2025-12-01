# Enhanced Upload System Documentation

## Overview

The Enhanced Upload System provides a comprehensive user-in-the-loop workflow with AI assistance for uploading and processing trading scanner code. This system integrates Renata AI analysis with manual verification to ensure accurate parameter detection and strategy processing.

## Core Components

### 1. UploadPreviewModal.tsx
**Primary preview and verification interface**

**Features:**
- File information display
- AI detection results with confidence scoring
- Strategy naming interface
- Parameter review and editing
- Manual verification checklist
- Warning and feature detection display

**Key Props:**
```typescript
interface UploadPreviewModalProps {
  uploadData: UploadPreviewData;
  onConfirm: (data: ConfirmData) => Promise<void>;
  onCancel: () => void;
  onReanalyze: () => Promise<void>;
}
```

### 2. EnhancedStrategyUpload.tsx
**Main upload component with AI integration**

**Features:**
- Drag & drop file upload
- Code paste functionality
- Automatic AI analysis triggering
- Integration with preview modal
- Progress tracking and error handling

**Usage:**
```typescript
<EnhancedStrategyUpload
  onUpload={(file, code, metadata) => handleUpload(file, code, metadata)}
  onClose={() => setShowUpload(false)}
/>
```

### 3. useEnhancedUpload.ts
**React hook for upload management**

**Features:**
- Upload processing with AI metadata
- Parameter preservation validation
- Upload history and analytics
- Error handling and retry logic

**Usage:**
```typescript
const {
  uploadStrategy,
  isUploading,
  uploadResults,
  error,
  generateUploadReport
} = useEnhancedUpload();
```

## Workflow Process

### Phase 1: File Selection
1. User uploads file or pastes code
2. File validation (format, size)
3. Content reading and preparation
4. Automatic transition to AI analysis

### Phase 2: AI Analysis
1. Renata AI analyzes the code
2. Scanner type detection (A+, LC, Custom, Unknown)
3. Parameter extraction with values and types
4. Feature detection and warning generation
5. Confidence scoring

### Phase 3: Preview & Verification
1. Display analysis results with confidence indicators
2. Show detected parameters in editable format
3. Strategy naming interface
4. Manual verification checklist:
   - Scanner type detection accuracy
   - Parameter values correctness
   - Strategy naming completion

### Phase 4: Confirmation & Processing
1. Validate all verification checks
2. Process upload with enhanced metadata
3. Parameter preservation validation
4. Integration with existing formatting system
5. Success/failure feedback

## AI Integration Details

### Renata AI Analysis
**Endpoint:** OpenRouter API with qwen/qwen-2.5-72b-instruct model

**Analysis Process:**
```typescript
const analysisPrompt = `Analyze this trading scanner code and provide analysis in JSON format:
{
  "scannerType": "A+" | "LC" | "Custom" | "Unknown",
  "confidence": number (0-100),
  "parameterCount": number,
  "parameters": [...],
  "expectedEndpoint": "/api/route/expected",
  "tickerUniverseSize": number,
  "detectedFeatures": [...],
  "warnings": [...]
}`;
```

### Scanner Type Detection
- **A+**: Momentum/breakout scanners with volume spikes
- **LC**: Mean-reversion/pullback scanners with oversold conditions
- **Custom**: User-defined or complex multi-condition scanners
- **Unknown**: Unable to classify with confidence

### Parameter Detection
**Parameter Structure:**
```typescript
interface DetectedParameter {
  name: string;              // Parameter variable name
  value: string | number;    // Detected value
  type: 'number' | 'string' | 'boolean';
  description?: string;      // AI-generated description
  isUnusual?: boolean;       // Flag for unusual values
}
```

## Visual Design System

### Color Scheme
- **Primary Gold**: `#FFD700` - Action buttons, highlights
- **Success Green**: `#22c55e` - Success states, confirmations
- **Warning Yellow**: `#eab308` - Warnings, unusual parameters
- **Error Red**: `#ef4444` - Errors, failures
- **Info Blue**: `#3b82f6` - Information, features
- **Background**: `#1a1a1a` - Cards, surfaces
- **Border**: `#333333` - Borders, dividers
- **Text**: `#ffffff` / `#888888` - Primary/secondary text

### Component Styling
```css
/* Card containers */
.upload-card {
  border: 1px solid #333333;
  background: #1a1a1a;
  backdrop-filter: blur(8px);
}

/* Confidence indicators */
.confidence-high { color: #22c55e; }    /* 90%+ */
.confidence-medium { color: #eab308; }  /* 70-89% */
.confidence-low { color: #ef4444; }     /* <70% */

/* Progress indicators */
.step-active { border-color: #FFD700; background: #FFD700/10; }
.step-complete { border-color: #22c55e; background: #22c55e/10; }
.step-pending { border-color: #333333; background: #1a1a1a; }
```

## Integration Examples

### Basic Integration
```typescript
import EnhancedStrategyUpload from '@/components/EnhancedStrategyUpload';
import { useEnhancedUpload } from '@/hooks/useEnhancedUpload';

const MyComponent = () => {
  const { uploadStrategy } = useEnhancedUpload();
  const [showUpload, setShowUpload] = useState(false);

  const handleUpload = async (file, code, metadata) => {
    const result = await uploadStrategy(file, code, metadata);
    if (result.success) {
      // Handle successful upload
      console.log('Upload completed:', result);
    }
  };

  return (
    <>
      <Button onClick={() => setShowUpload(true)}>
        Upload Strategy
      </Button>
      {showUpload && (
        <EnhancedStrategyUpload
          onUpload={handleUpload}
          onClose={() => setShowUpload(false)}
        />
      )}
    </>
  );
};
```

### Advanced Integration with Analytics
```typescript
const {
  uploadStrategy,
  uploadResults,
  generateUploadReport,
  isUploading
} = useEnhancedUpload();

const report = generateUploadReport();

// Display statistics
console.log(`Success Rate: ${report.summary.successRate}%`);
console.log(`Average Confidence: ${report.summary.avgConfidence}%`);
console.log(`Scanner Types:`, report.scannerTypes);
```

## Error Handling

### Common Errors
1. **File Format Error**: Unsupported file type
2. **AI Analysis Error**: Renata AI service unavailable
3. **Parameter Validation Error**: Parameter preservation failed
4. **Upload Processing Error**: Backend formatting failed

### Error Recovery
- **Retry Mechanisms**: Automatic retry for transient failures
- **Fallback Analysis**: Basic analysis when AI fails
- **Manual Override**: Allow proceeding without AI analysis
- **Detailed Logging**: Comprehensive error information

## Performance Considerations

### Optimization Strategies
1. **Lazy Loading**: Load preview modal only when needed
2. **Debounced Analysis**: Avoid rapid AI calls during typing
3. **Caching**: Cache analysis results for identical code
4. **Progressive Enhancement**: Base functionality without AI

### Memory Management
- Clear upload results periodically
- Limit analysis history size
- Dispose of large file contents after processing

## Security Considerations

### Data Privacy
- Code analysis performed via secure API
- No persistent storage of uploaded code
- Secure token handling for AI service
- User consent for AI analysis

### Input Validation
- File size limits (5MB default)
- File type restrictions
- Content sanitization
- Parameter value validation

## Testing

### Unit Tests
- Component rendering and interaction
- Hook functionality and state management
- Parameter validation logic
- Error handling scenarios

### Integration Tests
- Full upload workflow
- AI analysis integration
- Backend formatting integration
- Error recovery flows

### User Testing
- Usability testing with real scanner code
- Performance testing with large files
- Accessibility testing
- Cross-browser compatibility

## Deployment

### Prerequisites
- React 18+
- Next.js 13+
- Tailwind CSS
- Radix UI components
- OpenRouter API access

### Configuration
```typescript
// Environment variables
OPENROUTER_API_KEY=your_api_key
BACKEND_API_URL=http://localhost:8000
ANALYSIS_CONFIDENCE_THRESHOLD=70
MAX_FILE_SIZE=5242880  // 5MB
```

### Monitoring
- Upload success/failure rates
- AI analysis accuracy
- User verification completion rates
- Performance metrics

## Future Enhancements

### Planned Features
1. **Batch Upload**: Multiple file processing
2. **Template Library**: Pre-built scanner templates
3. **Advanced Analytics**: ML-driven insights
4. **Collaboration**: Team sharing and review
5. **Version Control**: Strategy versioning and diff

### API Extensions
1. **Custom AI Models**: Specialized scanner analysis
2. **Real-time Validation**: Live parameter checking
3. **Market Data Integration**: Context-aware validation
4. **Performance Prediction**: Expected strategy performance

## Support

### Documentation
- Component API reference
- Integration guides
- Troubleshooting guides
- Best practices

### Community
- GitHub discussions
- Discord community
- Video tutorials
- Example repositories

---

*This documentation covers the Enhanced Upload System v1.0. For updates and additional resources, visit the project repository.*