# Project Creation API - Detailed Technical Reference

## API Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js/React)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ProjectManager.tsx                                              │
│  ├─ CreateProjectModal                                           │
│  │  ├─ Form Fields: name, description, tags, aggregation_method │
│  │  └─ Calls: projectApiService.createProject()                 │
│  │                                                               │
│  └─ ProjectCard                                                  │
│     ├─ Displays: project.scanner_count, tags, execution stats   │
│     └─ Actions: Edit, Delete, Open, Run                         │
│                                                                  │
│  projectApiService.ts                                            │
│  └─ createProject(request): Promise<Project>                    │
│     └─ POST /api/projects with CreateProjectRequest             │
│                                                                  │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  │ HTTP POST /api/projects
                  │ Content-Type: application/json
                  │ Body: {
                  │   "name": "My Project",
                  │   "description": "...",
                  │   "aggregation_method": "union",
                  │   "tags": []
                  │ }
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI/Python)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  api_endpoints.py                                                │
│  └─ @app.post("/api/projects")                                  │
│     └─ create_project(request: CreateProjectRequest)            │
│        ├─ Creates ProjectConfig with scanners=[]                │
│        ├─ Calls ProjectConfig.__post_init__()  ◄─── VALIDATION  │
│        └─ Returns HTTP 500 Error on failure                     │
│                                                                  │
│  project_config.py                                               │
│  └─ class ProjectConfig(dataclass)                              │
│     └─ def __post_init__(self):                                 │
│        ├─ if not self.scanners:  # EMPTY LIST = TRUE            │
│        │  └─ raise ValueError(...)  ◄─── ERROR HAPPENS HERE     │
│        ├─ Validate scanner IDs unique                           │
│        └─ Validate scanner files exist                          │
│                                                                  │
│  project_composition/models.py                                   │
│  └─ class ProjectConfig (Pydantic)                              │
│     └─ (Also used for data validation)                          │
│                                                                  │
└─────────────────┬──────────────────────────────────────────────┘
                  │
                  │ HTTP 500 Response
                  │ {
                  │   "detail": "Failed to create project: 
                  │              Project must contain at least 
                  │              one scanner"
                  │ }
                  │
                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND ERROR HANDLING                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  projectApiService.ts                                            │
│  └─ request<T>(endpoint, options)                               │
│     ├─ if (!response.ok)                                         │
│     │  ├─ Parse error JSON/text                                 │
│     │  └─ throw new Error(errorMessage)                         │
│     └─ Caught by handleSubmit()                                 │
│                                                                  │
│  ProjectManager.tsx                                              │
│  └─ handleSubmit(e)                                             │
│     ├─ await onSubmit(projectData)                              │
│     └─ catch (error) => setErrors([error.message])              │
│                                                                  │
│  CreateProjectModal.tsx                                          │
│  └─ Display errors in red box                                   │
│     └─ User sees: "Failed to create project: Project must       │
│                    contain at least one scanner"                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Code Flow Analysis

### 1. Frontend: CreateProjectModal Form Submission

**File**: `src/components/projects/ProjectManager.tsx` (lines 39-231)

```typescript
const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen, onClose, onSubmit, templates
}) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    aggregation_method: AggregationMethod.UNION,
    tags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Apply template if selected
      let projectData = { ...formData };
      
      // Validate locally
      const validationErrors = projectApiService.validateProject(projectData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;  // Stops here if local validation fails
      }

      // Makes API call
      await onSubmit(projectData);  // Line 81
      onClose();
      
    } catch (error: any) {
      setErrors([error.message || 'Failed to create project']);
      // Line 91: Error is caught and displayed
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 ...">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Form fields... */}
        
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-900 border border-red-700 ...">
            {errors.map((error, index) => (
              <p key={index} className="text-red-300 ...">{error}</p>
            ))}
          </div>
        )}
      </form>
    </div>
  );
};
```

### 2. Frontend: API Service Call

**File**: `src/services/projectApiService.ts` (lines 85-90)

```typescript
async createProject(request: CreateProjectRequest): Promise<Project> {
  return this.request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// Generic request handler
private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.text();
      let errorMessage: string;

      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.detail || errorJson.message || 'API request failed';
      } catch {
        errorMessage = errorData || `HTTP ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);  // Line 56
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}
```

**Payload Sent to Backend**:
```json
{
  "name": "My Project",
  "description": "Project description",
  "aggregation_method": "union",
  "tags": ["momentum"]
}
```

### 3. Backend: API Endpoint

**File**: `backend/project_composition/api_endpoints.py` (lines 153-186)

```python
@app.post("/api/projects", response_model=ProjectResponse)
async def create_project(request: CreateProjectRequest):
    """Create a new project"""
    try:
        # Create project configuration
        project_config = ProjectConfig(
            project_id="",  # Will be auto-generated
            name=request.name,
            description=request.description,
            scanners=[],  # <-- EMPTY LIST PASSED HERE
            aggregation_method=request.aggregation_method,
            tags=request.tags
        )  # <-- ProjectConfig.__post_init__() called immediately

        # If we get here, validation passed
        config_path = project_manager.create_project(project_config)

        # Return project response
        return ProjectResponse(
            id=project_config.project_id,
            name=project_config.name,
            description=project_config.description,
            aggregation_method=project_config.aggregation_method.value,
            tags=project_config.tags,
            scanner_count=0,
            created_at=project_config.created_at.isoformat(),
            updated_at=project_config.updated_at.isoformat(),
            last_executed=None,
            execution_count=0
        )

    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create project: {e}")
        # Returns JSON response with error details
```

### 4. Backend: ProjectConfig Validation

**File**: `backend/project_composition/project_config.py` (lines 92-111)

```python
@dataclass
class ProjectConfig:
    """Core project configuration managing multiple isolated scanners"""
    project_id: str
    name: str
    description: str
    scanners: List[ScannerReference]  # <-- REQUIRED, no default value
    aggregation_method: AggregationMethod = AggregationMethod.UNION
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    version: int = 1
    tags: List[str] = field(default_factory=list)
    created_by: Optional[str] = None
    last_executed: Optional[datetime] = None
    execution_count: int = 0

    def __post_init__(self):
        """Validate project configuration"""
        if not self.project_id:
            self.project_id = str(uuid.uuid4())

        if not self.name:
            raise ValueError("Project name cannot be empty")

        # THE PROBLEM IS HERE:
        if not self.scanners:  # <-- Line 100
            # Empty list [] evaluates to False
            raise ValueError("Project must contain at least one scanner")  # <-- Line 101
            # ^^^ THIS IS RAISED ^^^

        # These validations only run if we pass the scanners check
        scanner_ids = [s.scanner_id for s in self.scanners]
        if len(scanner_ids) != len(set(scanner_ids)):
            raise ValueError("Scanner IDs must be unique within project")

        for scanner in self.scanners:
            if not os.path.exists(scanner.scanner_file):
                raise ValueError(f"Scanner file not found: {scanner.scanner_file}")
```

## Request/Response Models

### CreateProjectRequest (Pydantic Model)
**File**: `backend/project_composition/api_endpoints.py` (lines 58-63)

```python
class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Project name")
    description: Optional[str] = Field("", description="Project description")
    aggregation_method: AggregationMethod = Field(AggregationMethod.UNION, description="Signal aggregation method")
    tags: List[str] = Field(default_factory=list, description="Project tags")
    # NOTE: No scanners field - intentional design choice
```

### ProjectResponse (Pydantic Model)
**File**: `backend/project_composition/api_endpoints.py` (lines 111-122)

```python
class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    aggregation_method: str
    tags: List[str]
    scanner_count: int
    created_at: str
    updated_at: str
    last_executed: Optional[str]
    execution_count: int
```

## Add Scanner Endpoint (Works After Fix)

**File**: `backend/project_composition/api_endpoints.py` (lines 303-348)

```python
@app.post("/api/projects/{project_id}/scanners", response_model=ScannerResponse)
async def add_scanner_to_project(project_id: str, request: AddScannerRequest):
    """Add a scanner to a project"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # Create scanner reference
        scanner_ref = ScannerReference(
            scanner_id=request.scanner_id,
            scanner_file=request.scanner_file,
            parameter_file="",
            enabled=request.enabled,
            weight=request.weight,
            order_index=request.order_index
        )

        # Add scanner to project
        project.add_scanner(scanner_ref)  # <-- Uses project.add_scanner() method

        # Save updated project
        project_manager.update_project(project)

        return ScannerResponse(
            id=scanner_ref.scanner_id,
            scanner_id=scanner_ref.scanner_id,
            scanner_file=scanner_ref.scanner_file,
            enabled=scanner_ref.enabled,
            weight=scanner_ref.weight,
            order_index=scanner_ref.order_index,
            parameter_count=parameter_count
        )

    except Exception as e:
        logger.error(f"Failed to add scanner: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add scanner: {e}")
```

## Project Execution Endpoint (Needs Update)

**File**: `backend/project_composition/api_endpoints.py` (lines 502-550)

```python
@app.post("/api/projects/{project_id}/execute", response_model=ExecutionResponse)
async def execute_project(project_id: str, request: ExecuteProjectRequest, background_tasks: BackgroundTasks):
    """Execute a project (async)"""
    try:
        project = project_manager.load_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        # MISSING VALIDATION: Check if project has scanners
        # Should add this check here:
        # if not project.scanners:
        #     raise HTTPException(
        #         status_code=400,
        #         detail="Project must contain at least one enabled scanner before execution"
        #     )

        # Create execution configuration
        execution_config = ExecutionConfig(
            date_range=request.date_range,
            symbols=request.symbols,
            filters=request.filters,
            parallel_execution=request.parallel_execution,
            timeout_seconds=request.timeout_seconds
        )

        # ... rest of execution code
```

## Implementation Checklist

### Step 1: Modify ProjectConfig to Allow Empty Scanners
- [ ] Edit `project_config.py` line 100-101
- [ ] Change from: `if not self.scanners:`
- [ ] Change to: `if len(self.scanners) > 0:`
- [ ] Move scanner ID uniqueness validation inside the conditional
- [ ] Move scanner file existence validation inside the conditional

### Step 2: Add Validation to Execution Endpoint
- [ ] Edit `api_endpoints.py` execute_project() function
- [ ] Add check: `if not project.scanners:`
- [ ] Raise HTTPException with 400 status code
- [ ] Error message: "Project must contain at least one enabled scanner before execution"

### Step 3: Update remove_scanner Method
- [ ] Edit `project_config.py` remove_scanner() method
- [ ] Ensure it doesn't block removal of last scanner
- [ ] Let execution validation catch the error

### Step 4: Add Tests
- [ ] Test creating project without scanners (should succeed)
- [ ] Test adding scanner to blank project
- [ ] Test executing project without scanners (should fail)

## Expected Behavior After Fix

### Success Case: Create Project
```
Request:
  POST /api/projects
  {
    "name": "My Project",
    "description": "Test project",
    "aggregation_method": "union",
    "tags": ["test"]
  }

Response (201 Created):
  {
    "id": "uuid-1234",
    "name": "My Project",
    "description": "Test project",
    "aggregation_method": "union",
    "tags": ["test"],
    "scanner_count": 0,  <-- ALLOWS 0 SCANNERS
    "created_at": "2024-11-11T...",
    "updated_at": "2024-11-11T...",
    "last_executed": null,
    "execution_count": 0
  }
```

### Add Scanner to Project
```
Request:
  POST /api/projects/uuid-1234/scanners
  {
    "scanner_id": "lc_frontside_d3",
    "scanner_file": "path/to/scanner.py",
    "enabled": true,
    "weight": 1.0,
    "order_index": 0
  }

Response (200 OK):
  Scanner added successfully
```

### Execute Empty Project (Fails at Execution)
```
Request:
  POST /api/projects/uuid-1234/execute
  {
    "date_range": {"start_date": "2024-01-01", "end_date": "2024-01-31"},
    "symbols": ["AAPL"],
    "parallel_execution": true,
    "timeout_seconds": 300
  }

Response (400 Bad Request):
  {
    "detail": "Project must contain at least one enabled scanner before execution"
  }
```

## Error Handling Chain

### Current (Broken)
```
Frontend Form Submit
  → projectApiService.createProject(data)
  → fetch POST /api/projects
  → Backend creates ProjectConfig(scanners=[])
  → ProjectConfig.__post_init__() validation
  → ValueError raised
  → HTTPException(500) returned
  → Frontend error handler catches
  → User sees "Project must contain at least one scanner"
  → User cannot create project
```

### After Fix
```
Frontend Form Submit
  → projectApiService.createProject(data)
  → fetch POST /api/projects
  → Backend creates ProjectConfig(scanners=[])
  → ProjectConfig.__post_init__() validation passes
  → Project saved to disk
  → HTTPException(201) with project data returned
  → Frontend success handler processes
  → Modal closes
  → User sees new project in list
  → User adds scanners via add_scanner endpoint
  → User executes project
  → If no scanners, execute_project validation fails
  → User sees "Project must contain at least one scanner before execution"
```

