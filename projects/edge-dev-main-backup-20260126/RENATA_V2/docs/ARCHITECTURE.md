# Renata V2 Architecture

## 🔧 System Components

```
┌──────────────────────────────────────────────────────────────────┐
│                         Renata V2 System                        │
└──────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
   ┌──────────┐        ┌──────────┐        ┌──────────┐
   │   AST    │        │    AI    │        │ Template │
   │  Parser  │        │ Agent   │        │  Engine  │
   └──────────┘        └──────────┘        └──────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   v31 Scanner    │
                    │     Output       │
                    └──────────────────┘
```

---

## 📋 Component Details

### 1. AST Parser Component

**Purpose**: Understand code structure

**Technology**: Python `ast` module, `refactor` library

**Process**:
```python
# Input: User's scanner code
code = """
def scan_stocks():
    stocks = get_all_stocks()
    for stock in stocks:
        if stock['price'] > stock['ma200']:
            print(f"{stock['ticker']} is bullish")
"""

# AST Parsing
tree = ast.parse(code)

# Extract Structure
structure = {
    "functions": ["scan_stocks"],
    "conditions": [
        {"type": "Compare", "op": ">", "left": "stock['price']", "right": "stock['ma200']"}
    ],
    "data_sources": ["get_all_stocks()"],
    "pattern_type": "trend_following",
    "scanner_type": "SINGLE_SCANNER"
}
```

**Output**: Structured code understanding

---

### 2. AI Agent Component

**Purpose**: Extract strategy intent and parameters

**Technology**: OpenRouter API with code-specialized models

**Process**:
```python
# Input: AST structure + original code
ai_agent = Agent('openai:gpt-4')

# Extract Strategy Intent
strategy = ai_agent.run(f"""
Analyze this scanner code and extract:

1. Strategy Name: What pattern is being traded?
2. Entry Conditions: What triggers the setup?
3. Parameters: What are the numeric thresholds?
4. Timeframe: Daily, intraday, multi-day?
5. Scanner Type: Single or multi-pattern?

Code:
{code}

Return as JSON.
""")

# Output
{
    "strategy_name": "Moving Average Trend",
    "entry_conditions": [
        "price > 200-day MA",
        "price is bullish"
    ],
    "parameters": {
        "ma_period": 200,
        "min_price": null
    },
    "timeframe": "daily",
    "scanner_type": "SINGLE_SCANNER"
}
```

**Output**: Structured strategy understanding

---

### 3. Template Engine Component

**Purpose**: Enforce v31 structure

**Technology**: Jinja2 templates

**Templates**:
- `v31_single_scanner.j2` - For single-pattern scanners
- `v31_multi_scanner.j2` - For multi-pattern scanners
- `components/` - Reusable v31 components

**Process**:
```python
# Input: Strategy understanding
template = env.get_template('v31_single_scanner.j2')

# Render with strategy
v31_code = template.render(
    scanner_name="MATrendScanner",
    description="Moving Average trend following strategy",
    strategy_logic=generate_pattern_logic(strategy),
    stage1_workers=5,
    stage3_workers=10
)
```

**Output**: v31-compliant Python code

---

## 🔄 Complete Workflow

### Single-Scanner Transformation

```
1. Upload Scanner
   └─> User uploads: cleanogscans.py

2. AST Parsing
   └─> Extract: Functions, conditions, data sources
   └─> Detect: Single-pattern scanner

3. AI Analysis
   └─> Understand: D1 Gap with pre-market momentum
   └─> Extract: gap >= 0.5, pm_volume >= 5M, prev_close >= 0.75
   └─> Map to: v31 components

4. Template Rendering
   └─> Select: v31_single_scanner.j2
   └─> Insert: AI-generated pattern logic
   └─> Generate: D1GapScanner class

5. Validation
   └─> AST parse: Validate Python syntax
   └─> Structure check: Validate v31 compliance
   └─> Test run: Verify it executes

6. Output
   └─> D1GapScanner.py (v31 compliant)
```

### Multi-Scanner Transformation

```
1. Upload Scanner
   └─> User uploads: SC DMR SCAN.py

2. AST Parsing
   └─> Extract: Multiple pattern columns (d2_pm_setup, d2_pmh_break, d3, d4)
   └─> Detect: Multi-pattern scanner

3. AI Analysis (Per Pattern)
   └─> Pattern 1: D2 PM Setup
       ├─ Filters: prev_close >= 0.75, prev_volume >= 10M, prev_high_gain >= 50%
       └─ Conditions: pct_pmh_gap >= 0.5, close_range >= 0.5

   └─> Pattern 2: D2 PMH Break
       ├─ Filters: prev_close >= 0.75, prev_volume >= 10M, gap_pct >= 0.2
       └─ Conditions: dol_gap >= prev_range * 0.3, high >= pm_high

   └─> Pattern 3: D3
       ├─ Filters: prev_close >= 0.75, prev_volume >= 10M, gap_consecutive >= 2
       └─ Conditions: 3-day consecutive setup

4. Template Rendering
   └─> Select: v31_multi_scanner.j2
   └─> Generate: Pattern-specific filter methods
   └─> Generate: Pattern-specific check methods
   └─> Output: DMRMultiScanner class

5. Validation
   └─> AST parse: Validate Python syntax
   └─> Structure check: Validate v31 compliance
   └─> Pattern filter check: Validate pattern-specific filters
   └─> Test run: Verify all patterns execute

6. Output
   └─> DMRMultiScanner.py (v31 compliant)
```

---

## 🎯 Scanner Type Detection

### How AST Distinguishes Types

```python
class ScannerTypeDetector(ast.NodeVisitor):
    """Detect if scanner is single or multi-pattern"""

    def __init__(self):
        self.pattern_count = 0
        self.has_multiple_pattern_columns = False

    def visit_Assign(self, node):
        """Look for pattern column assignments"""
        if isinstance(node.targets[0], ast.Subscript):
            if isinstance(node.targets[0].slice, ast.Constant):
                col_name = node.targets[0].slice.value
                if 'pattern' in col_name.lower() or col_name in ['d2', 'd3', 'd4', 'lc_frontside']:
                    self.pattern_count += 1

        # Check if multiple patterns
        if self.pattern_count > 3:
            self.has_multiple_pattern_columns = True

    def get_scanner_type(self):
        """Determine scanner type"""
        if self.has_multiple_pattern_columns:
            return "MULTI_SCANNER"
        else:
            return "SINGLE_SCANNER"
```

### Detection Rules

**Single-Scanner Indicators**:
- One pattern condition
- Returns simple list
- Focused on one setup

**Multi-Scanner Indicators**:
- Multiple pattern column assignments
- Returns dict grouped by pattern
- Pattern-specific filter sections
- Combines multiple patterns at end

---

## 🗂️ Data Flow

### Input Data Flow

```
User Upload
    ↓
Raw Scanner Code
    ↓
┌─────────────────────────────────┐
│  AST Parser                      │
│  - Parse Python code             │
│  - Extract structure             │
│  - Detect scanner type           │
└─────────────────────────────────┘
    ↓
Structured Understanding
    ↓
┌─────────────────────────────────┐
│  AI Agent                        │
│  - Extract strategy intent        │
│  - Identify parameters            │
│  - Map to v31 components         │
└─────────────────────────────────┘
    ↓
Strategy Specification
    ↓
┌─────────────────────────────────┐
│  Template Engine                 │
│  - Select appropriate template    │
│  - Insert strategy logic         │
│  - Generate v31 code            │
└─────────────────────────────────┘
    ↓
v31 Scanner Code
```

### Output Data Flow

```
v31 Scanner Code
    ↓
┌─────────────────────────────────┐
│  Validation Engine               │
│  - AST parse output              │
│  - Check v31 structure           │
│  - Verify syntax                 │
└─────────────────────────────────┘
    ↓
Valid v31 Scanner
    ↓
EdgeDev Integration
    ↓
Production Scanner
```

---

## 🔐 Validation Pipeline

### Three-Stage Validation

**Stage 1: Syntax Validation**
```python
try:
    tree = ast.parse(generated_code)
    print("✅ Valid Python syntax")
except SyntaxError as e:
    print(f"❌ Syntax error: {e}")
    return False
```

**Stage 2: Structure Validation**
```python
# Check for required v31 structure
required_methods = [
    'fetch_grouped_data',
    'apply_smart_filters',
    'detect_patterns',
    'run_scan'
]

for node in ast.walk(tree):
    if isinstance(node, ast.ClassDef):
        found_methods = [n.name for n in node.body if isinstance(n, ast.FunctionDef)]
        missing = set(required_methods) - set(found_methods)
        if missing:
            print(f"❌ Missing methods: {missing}")
            return False

print("✅ v31 structure compliant")
```

**Stage 3: Logic Validation**
```python
# Check for common issues
issues = []

# Check function names
if 'fetch_all_grouped_data' in generated_code:
    issues.append("❌ Using fetch_all_grouped_data (should be fetch_grouped_data)")

# Check for invalid characters
if '$' in generated_code:
    issues.append("❌ Contains invalid special characters ($)")

# Check API usage
if 'get_all_stocks()' in generated_code:
    issues.append("❌ Using get_all_stocks() (should use Polygon grouped endpoint)")

if issues:
    for issue in issues:
        print(issue)
    return False

print("✅ Logic validation passed")
```

---

## 🎨 Template System

### Template Hierarchy

```
base.j2 (Base v31 structure)
    ├── single_scanner.j2 (Single pattern scanners)
    │   └── scanner_name: {{ scanner_name }}
    │   └── pattern_logic: {{ ai_generated_logic }}
    │
    └── multi_scanner.j2 (Multi pattern scanners)
        └── patterns: {{ patterns }}
        └── for each pattern:
            ├── pattern_filters: {{ pattern_filters }}
            ├── pattern_indicators: {{ pattern_indicators }}
            └── pattern_check: {{ pattern_check }}
```

### Template Variables

**Common Variables**:
```python
{{ scanner_name }}         # Name of the scanner class
{{ description }}          # Strategy description
{{ stage1_workers }}       # Parallel workers for data fetching
{{ stage3_workers }}       # Parallel workers for pattern detection
{{ pattern_logic }}        # AI-generated pattern detection code
```

**Multi-Scanner Variables**:
```python
{{ patterns }}             # List of patterns to scan for
{% for pattern in patterns %}
    {{ pattern.name }}
    {{ pattern.filters }}       # Pattern-specific smart filters
    {{ pattern.indicators }}   # Pattern-specific indicators
    {{ pattern.conditions }}  # Pattern-specific conditions
{% endfor %}
```

---

## 🚀 Performance Considerations

### Optimization Strategies

**1. Parallel Processing**
```python
# Stage 1: Fetch data in parallel
with ThreadPoolExecutor(max_workers=5) as executor:
    futures = {executor.submit(fetch_date, date): date for date in dates}
```

**2. Vectorized Operations**
```python
# Use pandas vectorized operations instead of loops
df['gap_pct'] = (df['open'] / df['prev_close']) - 1  # ✅ Vectorized
# NOT:
for i, row in df.iterrows():  # ❌ Slow
    row['gap_pct'] = (row['open'] / row['prev_close']) - 1
```

**3. Pattern-Specific Filtering**
```python
# For multi-scanners, filter BEFORE pattern checking
for pattern in patterns:
    # Apply pattern-specific filters (reduces dataset)
    filtered_data = apply_pattern_filters(data, pattern.filters)
    # Then check pattern (much smaller dataset)
    results = pattern.check(filtered_data)
```

**4. Common Indicator Calculation**
```python
# Calculate common indicators ONCE
common_indicators = calculate_emas(atr, slopes, gaps)

# Use for all patterns
for pattern in patterns:
    pattern_results = pattern.check(common_indicators)
```

---

## 🔧 Technology Stack

### Core Technologies
- **Python 3.10+**: Core language
- **ast module**: AST parsing (built-in)
- **refactor library**: Advanced AST manipulation
- **Jinja2**: Template engine
- **OpenRouter API**: AI model access

### AI Models
- **Primary**: `qwen/qwen-3-coder-32b-instruct`
- **Fallback**: `deepseek/deepseek-coder`
- **Validation**: `openai/gpt-4`

### Integration Points
- **EdgeDev Frontend**: `/src/components/` and `/src/app/api/`
- **EdgeDev Backend**: `/backend/` and `/backend/generated_scanners/`
- **Project System**: Integration with project API

---

## 📊 Success Metrics

### Performance Metrics
- **Transformation Time**: < 30 seconds per scanner
- **Validation Success Rate**: > 95%
- **Structure Compliance**: 100%
- **Logic Preservation**: 100%

### Quality Metrics
- **AST Validation Pass**: All generated code
- **v31 Compliance**: All generated code
- **Execution Success**: All generated scanners
- **Result Accuracy**: Matches original scanner logic

---

**Version**: 2.0
**Last Updated**: 2025-01-02
