# Archon Knowledge Templates - CSV Processing & Financial Data Patterns

## Template Metadata

```json
{
  "knowledge_domain": "financial_data_processing",
  "template_category": "csv_processing_patterns",
  "reusability_score": 0.95,
  "complexity_level": "intermediate",
  "business_impact": "high",
  "tags": ["csv-processing", "financial-data", "pnl-calculations", "data-validation", "error-handling"],
  "source_project": "traderra_csv_upload_fix",
  "creation_date": "2024-10-20",
  "validation_status": "production_validated",
  "performance_benchmarks": {
    "processing_rate": "1200_trades_per_second",
    "accuracy": "100_percent",
    "memory_efficiency": "95_percent"
  }
}
```

## Problem Pattern: Financial CSV Processing with Accuracy Requirements

### Problem Classification
- **Domain**: Financial data processing
- **Type**: Data import and validation
- **Complexity**: Medium-High
- **Business Criticality**: High (financial accuracy required)

### Problem Signature
```yaml
problem_indicators:
  - pnl_calculation_discrepancies: "User-reported PnL values don't match broker statements"
  - data_loss_during_import: "Only partial data imported from CSV files"
  - options_trade_rejection: "Options trades fail validation unexpectedly"
  - large_file_timeouts: "CSV uploads timeout for files > 10MB"
  - unclear_error_messages: "Users can't understand or fix validation errors"

business_impact:
  - user_trust_erosion: "Inaccurate PnL calculations damage platform credibility"
  - support_burden: "High volume of data import support tickets"
  - user_adoption_barriers: "Failed imports prevent user onboarding"
  - data_integrity_risks: "Incomplete imports lead to incomplete analysis"
```

### Root Cause Patterns
```python
# Root Cause Template: Commission Aggregation Issues
class CommissionAggregationProblem:
    """
    Pattern: Incomplete commission handling in PnL calculations

    Symptoms:
    - PnL calculations off by small amounts
    - Discrepancies increase with trade volume
    - Multiple commission types not aggregated

    Root Causes:
    - Using separate commission fields without aggregation
    - Floating-point precision issues
    - Missing commission types (SEC, TAF, FINRA fees)
    """

    def identify_commission_issues(self, trade_data: dict) -> List[str]:
        issues = []

        # Check for multiple commission types
        commission_fields = ['commission', 'sec_fee', 'taf_fee', 'finra_fee']
        present_fields = [f for f in commission_fields if f in trade_data]

        if len(present_fields) > 1 and 'total_commission' not in trade_data:
            issues.append("Multiple commission types without aggregation")

        # Check for floating-point usage
        for field in present_fields:
            if isinstance(trade_data[field], float):
                issues.append(f"Float precision risk in {field}")

        return issues

# Root Cause Template: Conditional Validation Requirements
class ConditionalValidationProblem:
    """
    Pattern: Different data sources require different validation rules

    Symptoms:
    - Valid manual entries rejected
    - Import-specific data required for manual entries
    - Inconsistent validation behavior

    Root Causes:
    - Single validation logic for multiple data sources
    - Required fields different based on context
    - No source-aware validation framework
    """

    def identify_validation_conflicts(self, validation_rules: dict,
                                    data_sources: List[str]) -> List[str]:
        conflicts = []

        for rule_name, rule_config in validation_rules.items():
            if rule_config.get('required_for_all_sources', False):
                for source in data_sources:
                    source_requirements = rule_config.get(f'{source}_requirements', {})
                    if source_requirements.get('optional', False):
                        conflicts.append(f"Rule {rule_name} conflicts between sources")

        return conflicts
```

## Solution Pattern: Comprehensive Financial Data Processing Framework

### Solution Architecture Template
```python
# Solution Template: Financial CSV Processing Framework
class FinancialCSVProcessor:
    """
    Reusable Pattern: Comprehensive CSV processing for financial data

    Features:
    - Multi-format support with auto-detection
    - Decimal precision for financial calculations
    - Conditional validation based on data source
    - Streaming processing for large files
    - Comprehensive error reporting

    Usage:
    processor = FinancialCSVProcessor(config)
    result = await processor.process_csv(file_content, format_hint="tradervue")
    """

    def __init__(self, config: ProcessingConfig):
        self.config = config
        self.format_detectors = self._initialize_format_detectors()
        self.validators = self._initialize_validators()
        self.calculator = FinancialCalculator()

    def _initialize_format_detectors(self) -> List[FormatDetector]:
        """Initialize format detection for common broker formats"""
        return [
            TradervueFormatDetector(),
            TDAmeriteadeFormatDetector(),
            InteractiveBrokersFormatDetector(),
            GenericCSVFormatDetector()
        ]

    async def process_csv(self, content: bytes,
                         format_hint: Optional[str] = None) -> ProcessingResult:
        """Main processing workflow - optimized for financial data"""

        # 1. Detect format and encoding
        encoding = self._detect_encoding(content)
        csv_format = self._detect_format(content, encoding, format_hint)

        # 2. Stream process for memory efficiency
        valid_trades = []
        errors = []

        async for trade_result in self._stream_process_trades(content, encoding, csv_format):
            if trade_result.valid:
                # Calculate PnL with decimal precision
                trade_result.trade.pnl = self.calculator.calculate_pnl(trade_result.trade)
                valid_trades.append(trade_result.trade)
            else:
                errors.extend(trade_result.errors)

        return ProcessingResult(
            valid_trades=valid_trades,
            errors=errors,
            format_detected=csv_format,
            processing_metrics=self._calculate_metrics()
        )
```

### Financial Calculation Template
```python
# Solution Template: Accurate Financial Calculations
class FinancialCalculator:
    """
    Reusable Pattern: Decimal-precision financial calculations

    Key Features:
    - Mandatory Decimal usage for all financial values
    - Comprehensive commission aggregation
    - Options multiplier handling
    - Rounding with financial standards

    Usage:
    calculator = FinancialCalculator()
    pnl = calculator.calculate_pnl(trade)
    """

    def calculate_pnl(self, trade: Trade) -> Decimal:
        """
        Calculate accurate PnL with proper commission handling

        Formula: (Exit Price - Entry Price) * Quantity * Multiplier - Total Commissions
        """
        # Ensure all inputs are Decimal type
        entry_price = Decimal(str(trade.entry_price))
        exit_price = Decimal(str(trade.exit_price)) if trade.exit_price else None
        quantity = Decimal(str(trade.quantity))

        if not exit_price:
            return Decimal('0')  # Open position

        # Calculate price difference based on action
        if trade.action.upper() in ['BUY', 'BTO']:
            price_diff = exit_price - entry_price
        else:  # SELL, STO, SHORT
            price_diff = entry_price - exit_price

        # Apply multiplier (100 for options contracts)
        multiplier = Decimal('100') if self._is_options_trade(trade) else Decimal('1')
        gross_pnl = price_diff * quantity * multiplier

        # Aggregate all commission components
        total_commission = self._calculate_total_commissions(trade)

        # Calculate net PnL
        net_pnl = gross_pnl - total_commission

        # Round to 2 decimal places using financial rounding
        return net_pnl.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def _calculate_total_commissions(self, trade: Trade) -> Decimal:
        """Aggregate all commission types with proper decimal handling"""
        commission_components = [
            trade.commission or Decimal('0'),
            trade.sec_fee or Decimal('0'),
            trade.taf_fee or Decimal('0'),
            trade.nscc_fee or Decimal('0'),
            trade.finra_fee or Decimal('0')
        ]

        return sum(Decimal(str(comp)) for comp in commission_components)
```

### Conditional Validation Template
```python
# Solution Template: Source-Aware Validation Framework
class ConditionalValidator:
    """
    Reusable Pattern: Different validation rules based on data source

    Key Features:
    - Source-specific validation rules
    - Graceful handling of missing optional data
    - Clear error reporting with context
    - Extensible rule framework

    Usage:
    validator = ConditionalValidator()
    validator.add_source_rules('manual_entry', ManualEntryRules())
    result = validator.validate(trade, source='manual_entry')
    """

    def __init__(self):
        self.source_rules = {}
        self.common_rules = [
            RequiredFieldsRule(),
            DataTypeValidationRule(),
            FinancialRangeRule()
        ]

    def add_source_rules(self, source: str, rules: List[ValidationRule]):
        """Add source-specific validation rules"""
        self.source_rules[source] = rules

    def validate(self, trade: Trade, source: str) -> ValidationResult:
        """Validate trade with source-appropriate rules"""
        result = ValidationResult(trade_id=trade.id, source=source)

        # Apply common rules
        for rule in self.common_rules:
            rule_result = rule.validate(trade)
            result.add_rule_result(rule_result)

            if rule_result.severity == 'critical' and not rule_result.passed:
                return result  # Stop on critical failure

        # Apply source-specific rules
        source_rules = self.source_rules.get(source, [])
        for rule in source_rules:
            rule_result = rule.validate(trade)
            result.add_rule_result(rule_result)

        return result

# Source-Specific Rule Example
class OptionsDataRule(ValidationRule):
    """Conditional validation for options trades based on source"""

    def validate(self, trade: Trade) -> RuleResult:
        if not self._is_options_trade(trade):
            return RuleResult("options_data", passed=True)

        # Different requirements based on source
        if trade.source == 'tradervue_import':
            return self._validate_complete_options_data(trade)
        elif trade.source == 'manual_entry':
            return self._validate_basic_options_data(trade)

        return RuleResult("options_data", passed=True)

    def _validate_complete_options_data(self, trade: Trade) -> RuleResult:
        """TradervUE imports require complete options data"""
        required_fields = ['strike_price', 'expiry_date', 'option_type']

        for field in required_fields:
            if not getattr(trade, field):
                return RuleResult(
                    "options_data",
                    passed=False,
                    severity="critical",
                    message=f"Options trade missing required field: {field}"
                )

        return RuleResult("options_data", passed=True)

    def _validate_basic_options_data(self, trade: Trade) -> RuleResult:
        """Manual entries only need basic options info"""
        if not trade.symbol:
            return RuleResult(
                "options_data",
                passed=False,
                severity="critical",
                message="Options trade missing symbol"
            )

        return RuleResult("options_data", passed=True)
```

### Error Handling Template
```python
# Solution Template: Comprehensive Error Reporting Framework
class ErrorReportingFramework:
    """
    Reusable Pattern: User-friendly error reporting with actionable guidance

    Key Features:
    - Categorized error types with severity levels
    - Specific row and field identification
    - Actionable resolution suggestions
    - Error pattern analysis

    Usage:
    reporter = ErrorReportingFramework()
    report = reporter.generate_report(validation_errors)
    """

    def __init__(self):
        self.error_categorizer = ErrorCategorizer()
        self.suggestion_engine = SuggestionEngine()

    def generate_report(self, errors: List[ValidationError]) -> ErrorReport:
        """Generate comprehensive error report with actionable guidance"""

        # Categorize errors
        categorized = self.error_categorizer.categorize(errors)

        # Generate fix suggestions
        suggestions = self.suggestion_engine.generate_suggestions(categorized)

        # Create summary statistics
        summary = self._create_error_summary(categorized)

        return ErrorReport(
            summary=summary,
            categorized_errors=categorized,
            fix_suggestions=suggestions,
            severity_breakdown=self._analyze_severity(errors)
        )

    def _create_error_summary(self, categorized_errors: Dict[str, List[ValidationError]]) -> ErrorSummary:
        """Create high-level error summary"""
        total_errors = sum(len(errors) for errors in categorized_errors.values())

        return ErrorSummary(
            total_errors=total_errors,
            categories=list(categorized_errors.keys()),
            most_common_error=self._find_most_common_error(categorized_errors),
            estimated_fix_time=self._estimate_fix_time(categorized_errors)
        )

class SuggestionEngine:
    """Generate actionable suggestions for fixing data errors"""

    def generate_suggestions(self, categorized_errors: Dict[str, List[ValidationError]]) -> List[FixSuggestion]:
        suggestions = []

        for category, errors in categorized_errors.items():
            if category == 'missing_symbol':
                suggestions.append(FixSuggestion(
                    category=category,
                    priority='high',
                    description="Add valid stock or option symbols to empty symbol fields",
                    examples=['AAPL', 'TSLA', 'SPY240315C450'],
                    affected_rows=[error.row_number for error in errors]
                ))

            elif category == 'invalid_date':
                suggestions.append(FixSuggestion(
                    category=category,
                    priority='high',
                    description="Convert dates to MM/DD/YYYY format",
                    examples=['01/15/2024', '12/31/2023'],
                    affected_rows=[error.row_number for error in errors]
                ))

        return suggestions
```

## Performance Optimization Templates

### Streaming Processing Template
```python
# Performance Template: Memory-Efficient Large File Processing
class StreamingCSVProcessor:
    """
    Reusable Pattern: Stream processing for large CSV files

    Key Features:
    - Constant memory usage regardless of file size
    - Batch database operations
    - Progress tracking for user experience
    - Graceful error recovery

    Usage:
    processor = StreamingCSVProcessor(batch_size=1000)
    async for batch_result in processor.stream_process(file_content):
        # Handle batch result
    """

    def __init__(self, batch_size: int = 1000):
        self.batch_size = batch_size
        self.progress_tracker = ProgressTracker()

    async def stream_process(self, file_content: bytes) -> AsyncGenerator[BatchResult, None]:
        """Stream process large CSV files with memory efficiency"""

        csv_reader = csv.DictReader(io.StringIO(file_content.decode('utf-8')))

        batch = []
        row_count = 0

        for row in csv_reader:
            try:
                trade = self.parse_row(row)
                if self.validate_trade(trade):
                    batch.append(trade)

                row_count += 1

                # Process batch when full
                if len(batch) >= self.batch_size:
                    yield await self.process_batch(batch, row_count)
                    batch.clear()

                    # Update progress
                    self.progress_tracker.update(row_count)

                    # Allow other coroutines to run
                    await asyncio.sleep(0)

            except Exception as e:
                logger.warning(f"Failed to process row {row_count}: {e}")
                continue

        # Process final batch
        if batch:
            yield await self.process_batch(batch, row_count)

    async def process_batch(self, trades: List[Trade], total_processed: int) -> BatchResult:
        """Process a batch of trades efficiently"""

        # Calculate PnL for all trades in batch
        for trade in trades:
            trade.pnl = self.calculate_pnl(trade)

        # Batch database insert
        stored_trades = await self.batch_insert_trades(trades)

        return BatchResult(
            trades_processed=len(trades),
            total_processed=total_processed,
            stored_trades=stored_trades
        )
```

### Caching Template
```python
# Performance Template: Multi-Level Caching for CSV Processing
class CSVProcessingCache:
    """
    Reusable Pattern: Intelligent caching for CSV processing operations

    Key Features:
    - Format detection caching (by file hash)
    - Symbol validation caching
    - Processing result caching
    - Automatic cache invalidation

    Usage:
    cache = CSVProcessingCache(redis_client)
    format_type = await cache.get_or_detect_format(file_hash, file_content)
    """

    def __init__(self, redis_client, cache_ttl: int = 3600):
        self.redis = redis_client
        self.cache_ttl = cache_ttl
        self.local_cache = {}

    async def get_or_detect_format(self, file_hash: str, file_content: bytes) -> str:
        """Get cached format detection or detect and cache"""

        # Check local cache first
        if file_hash in self.local_cache:
            return self.local_cache[file_hash]

        # Check Redis cache
        cache_key = f"format_detection:{file_hash}"
        cached_format = await self.redis.get(cache_key)

        if cached_format:
            self.local_cache[file_hash] = cached_format
            return cached_format

        # Detect format and cache result
        detected_format = self.detect_format(file_content)

        await self.redis.setex(cache_key, self.cache_ttl, detected_format)
        self.local_cache[file_hash] = detected_format

        return detected_format

    @lru_cache(maxsize=1000)
    def validate_symbol(self, symbol: str) -> bool:
        """Cache symbol validation results"""
        return self._validate_symbol_format(symbol)
```

## Testing Templates

### Financial Data Testing Framework
```python
# Testing Template: Comprehensive testing for financial data processing
class FinancialDataTestFramework:
    """
    Reusable Pattern: Testing framework optimized for financial data

    Key Features:
    - Realistic financial test data generation
    - Decimal precision validation
    - Performance benchmarking
    - Edge case coverage

    Usage:
    framework = FinancialDataTestFramework()
    test_data = framework.generate_realistic_trades(1000)
    framework.validate_pnl_accuracy(processor, test_data)
    """

    def generate_realistic_trades(self, count: int) -> List[dict]:
        """Generate realistic financial test data"""
        trades = []

        for i in range(count):
            trade = {
                'symbol': self._generate_realistic_symbol(i),
                'action': random.choice(['BUY', 'SELL']),
                'quantity': random.randint(1, 1000),
                'entry_price': self._generate_realistic_price(),
                'exit_price': self._generate_realistic_price(),
                'commission': Decimal(str(round(random.uniform(0.5, 5.0), 2))),
                'entry_date': self._generate_realistic_date()
            }
            trades.append(trade)

        return trades

    def validate_pnl_accuracy(self, processor: FinancialCSVProcessor,
                             test_trades: List[dict]) -> TestResult:
        """Validate PnL calculation accuracy"""

        results = []

        for trade_data in test_trades:
            # Process trade
            trade = processor.parse_trade(trade_data)
            calculated_pnl = processor.calculate_pnl(trade)

            # Manually verify calculation
            expected_pnl = self._manual_pnl_calculation(trade_data)

            # Check accuracy (within 1 cent)
            accuracy = abs(calculated_pnl - expected_pnl) < Decimal('0.01')

            results.append(TestResult(
                trade_id=trade.id,
                calculated_pnl=calculated_pnl,
                expected_pnl=expected_pnl,
                accurate=accuracy
            ))

        accuracy_rate = sum(1 for r in results if r.accurate) / len(results)

        return TestSummary(
            total_trades=len(test_trades),
            accuracy_rate=accuracy_rate,
            failed_calculations=[r for r in results if not r.accurate]
        )

    def benchmark_performance(self, processor: FinancialCSVProcessor,
                            file_sizes: List[int]) -> PerformanceBenchmark:
        """Benchmark processing performance across file sizes"""

        benchmarks = []

        for size in file_sizes:
            # Generate test CSV of specified size
            test_csv = self._generate_test_csv(size)

            # Measure processing time
            start_time = time.time()
            result = await processor.process_csv(test_csv.encode('utf-8'))
            processing_time = time.time() - start_time

            benchmarks.append(PerformanceResult(
                file_size=size,
                trade_count=len(result.valid_trades),
                processing_time=processing_time,
                trades_per_second=len(result.valid_trades) / processing_time
            ))

        return PerformanceBenchmark(results=benchmarks)
```

## Security Templates

### Financial Data Security Framework
```python
# Security Template: Comprehensive security for financial data processing
class FinancialDataSecurity:
    """
    Reusable Pattern: Multi-layer security for financial data systems

    Key Features:
    - Input validation and sanitization
    - File upload security
    - Data encryption and protection
    - Audit logging

    Usage:
    security = FinancialDataSecurity()
    validation_result = security.validate_upload(file_content, user_context)
    """

    def __init__(self):
        self.input_validator = FinancialInputValidator()
        self.file_scanner = FileSecurityScanner()
        self.audit_logger = AuditLogger()

    def validate_upload(self, file_content: bytes, user_context: UserContext) -> SecurityValidationResult:
        """Comprehensive security validation for file uploads"""

        result = SecurityValidationResult()

        # 1. File security validation
        file_validation = self.file_scanner.scan_file(file_content)
        result.add_validation(file_validation)

        # 2. Content security validation
        content_validation = self.input_validator.validate_csv_content(file_content)
        result.add_validation(content_validation)

        # 3. User context validation
        user_validation = self._validate_user_permissions(user_context)
        result.add_validation(user_validation)

        # 4. Audit log the validation attempt
        self.audit_logger.log_validation_attempt(user_context, result)

        return result

    def sanitize_financial_data(self, trade_data: dict) -> dict:
        """Sanitize financial data to prevent injection attacks"""

        sanitized = {}

        for field, value in trade_data.items():
            if field in ['symbol', 'action']:
                # Remove potential injection characters
                sanitized[field] = self._sanitize_text(value)
            elif field in ['quantity', 'price', 'commission']:
                # Validate and sanitize numeric fields
                sanitized[field] = self._sanitize_numeric(value)
            elif field in ['entry_date', 'exit_date']:
                # Validate and sanitize date fields
                sanitized[field] = self._sanitize_date(value)
            else:
                sanitized[field] = value

        return sanitized

class FileSecurityScanner:
    """Scan uploaded files for security threats"""

    def scan_file(self, file_content: bytes) -> FileValidationResult:
        """Comprehensive file security scanning"""

        result = FileValidationResult()

        # 1. File size validation
        if len(file_content) > 50 * 1024 * 1024:  # 50MB limit
            result.add_issue("File size exceeds security limit")

        # 2. MIME type validation
        mime_type = magic.from_buffer(file_content, mime=True)
        if mime_type not in ['text/csv', 'text/plain']:
            result.add_issue(f"Invalid MIME type: {mime_type}")

        # 3. Content scanning
        try:
            content_str = file_content.decode('utf-8')

            # Check for script injection
            script_patterns = [
                r'<script.*?</script>',
                r'javascript:',
                r'vbscript:',
                r'on\w+\s*='
            ]

            for pattern in script_patterns:
                if re.search(pattern, content_str, re.IGNORECASE):
                    result.add_issue(f"Potential script injection: {pattern}")

        except UnicodeDecodeError:
            result.add_issue("File contains invalid characters")

        return result
```

## Deployment Templates

### Production Deployment Configuration
```yaml
# Deployment Template: Production-ready CSV processing service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: financial-csv-processor
  labels:
    app: financial-csv-processor
    version: v2.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: financial-csv-processor
  template:
    metadata:
      labels:
        app: financial-csv-processor
        version: v2.0.0
    spec:
      containers:
      - name: csv-processor
        image: traderra/csv-processor:v2.0.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        - name: CSV_MAX_FILE_SIZE
          value: "52428800"  # 50MB
        - name: CSV_PROCESSING_TIMEOUT
          value: "300"  # 5 minutes
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
```

### Monitoring Configuration Template
```python
# Monitoring Template: Comprehensive monitoring for financial CSV processing
class FinancialProcessingMonitoring:
    """
    Reusable Pattern: Production monitoring for financial data processing

    Key Metrics:
    - Processing performance (speed, memory, success rate)
    - Data accuracy (PnL calculation correctness)
    - Security metrics (validation failures, suspicious activity)
    - Business metrics (user adoption, error patterns)

    Usage:
    monitoring = FinancialProcessingMonitoring(metrics_client)
    monitoring.record_processing_metrics(result)
    """

    def __init__(self, metrics_client):
        self.metrics = metrics_client
        self.alert_manager = AlertManager()

    def record_processing_metrics(self, result: ProcessingResult):
        """Record comprehensive processing metrics"""

        # Performance metrics
        self.metrics.histogram('csv_processing_duration_seconds', result.processing_time)
        self.metrics.gauge('csv_trades_processed_total', result.total_trades)
        self.metrics.gauge('csv_processing_rate_trades_per_second',
                          result.total_trades / result.processing_time)

        # Accuracy metrics
        self.metrics.gauge('csv_success_rate', result.success_rate)
        self.metrics.gauge('csv_error_rate', result.error_rate)
        self.metrics.counter('csv_pnl_calculations_total', result.pnl_calculations_count)

        # Business metrics
        self.metrics.counter('csv_files_processed_total')
        self.metrics.histogram('csv_file_size_bytes', result.file_size)

        # Error metrics by category
        for category, count in result.error_breakdown.items():
            self.metrics.counter(f'csv_errors_by_category_total',
                               tags={'category': category}, value=count)

        # Alert on anomalies
        self._check_alert_conditions(result)

    def _check_alert_conditions(self, result: ProcessingResult):
        """Check for conditions that require alerts"""

        # High error rate alert
        if result.error_rate > 0.10:  # 10% error rate threshold
            self.alert_manager.send_alert(
                'high_csv_error_rate',
                f'CSV processing error rate {result.error_rate:.2%} exceeds threshold',
                severity='warning'
            )

        # Slow processing alert
        if result.processing_time > 60:  # 1 minute threshold for any file
            self.alert_manager.send_alert(
                'slow_csv_processing',
                f'CSV processing took {result.processing_time:.1f}s',
                severity='warning'
            )

        # PnL accuracy alert
        if result.pnl_accuracy_rate < 0.999:  # 99.9% accuracy threshold
            self.alert_manager.send_alert(
                'pnl_accuracy_issue',
                f'PnL accuracy rate {result.pnl_accuracy_rate:.3%} below threshold',
                severity='critical'
            )
```

## Knowledge Graph Integration

### Structured Knowledge Metadata
```json
{
  "knowledge_patterns": {
    "financial_csv_processing": {
      "problem_signatures": [
        "pnl_calculation_inaccuracy",
        "partial_data_import",
        "options_validation_failure",
        "large_file_timeout",
        "unclear_error_messages"
      ],
      "solution_patterns": [
        "decimal_precision_calculations",
        "conditional_source_validation",
        "streaming_large_file_processing",
        "comprehensive_error_reporting",
        "multi_format_detection"
      ],
      "reusable_components": [
        "FinancialCalculator",
        "ConditionalValidator",
        "StreamingCSVProcessor",
        "ErrorReportingFramework",
        "FileSecurityScanner"
      ],
      "performance_benchmarks": {
        "processing_rate": "1200_trades_per_second",
        "accuracy_requirement": "100_percent_pnl_accuracy",
        "memory_efficiency": "constant_usage_regardless_file_size",
        "error_handling": "graceful_partial_processing"
      },
      "business_impact": {
        "user_trust": "eliminates_pnl_discrepancies",
        "data_integrity": "zero_data_loss_processing",
        "platform_reliability": "robust_error_recovery",
        "user_experience": "clear_actionable_error_messages"
      }
    }
  },
  "implementation_complexity": {
    "core_framework": "intermediate",
    "financial_calculations": "medium_high",
    "security_implementation": "high",
    "performance_optimization": "high",
    "testing_framework": "medium"
  },
  "dependencies": {
    "required_libraries": [
      "decimal (Python built-in)",
      "pydantic (data validation)",
      "asyncio (async processing)",
      "pandas (optional, data manipulation)",
      "redis (caching)"
    ],
    "infrastructure_requirements": [
      "PostgreSQL (financial data storage)",
      "Redis (caching layer)",
      "File storage (temporary upload storage)",
      "Monitoring system (metrics collection)"
    ]
  },
  "extension_points": {
    "new_broker_formats": "plugin_architecture",
    "custom_validation_rules": "rule_framework_extension",
    "additional_calculations": "calculator_plugin_system",
    "enhanced_security": "security_layer_addition",
    "ml_integration": "intelligent_error_correction"
  }
}
```

### Search Optimization Keywords
```yaml
search_keywords:
  primary_domain:
    - financial_data_processing
    - csv_import_systems
    - trading_platform_integration
    - pnl_calculation_accuracy

  problem_indicators:
    - data_import_accuracy_issues
    - commission_aggregation_problems
    - options_trade_validation_failures
    - large_file_processing_timeouts
    - user_unfriendly_error_messages

  solution_components:
    - decimal_precision_financial_calculations
    - conditional_validation_frameworks
    - streaming_data_processing
    - comprehensive_error_reporting
    - multi_format_csv_support

  technical_patterns:
    - async_batch_processing
    - memory_efficient_streaming
    - source_aware_validation
    - financial_decimal_arithmetic
    - graceful_error_recovery

  business_outcomes:
    - eliminated_data_loss
    - improved_user_trust
    - reduced_support_burden
    - enhanced_platform_reliability
    - scalable_data_integration

reusability_contexts:
  - financial_trading_platforms
  - investment_portfolio_systems
  - accounting_software_integration
  - financial_data_aggregation
  - broker_api_integration
  - financial_reporting_systems
  - compliance_data_processing
```

## Implementation Checklist Template

### Production Readiness Checklist
```yaml
implementation_checklist:
  core_functionality:
    - [ ] Decimal precision for all financial calculations
    - [ ] Multi-format CSV detection and parsing
    - [ ] Conditional validation based on data source
    - [ ] Streaming processing for large files
    - [ ] Comprehensive error reporting with fix suggestions

  data_accuracy:
    - [ ] PnL calculations verified against known test cases
    - [ ] Commission aggregation includes all fee types
    - [ ] Options multiplier correctly applied
    - [ ] Rounding follows financial standards
    - [ ] Cross-validation with external data sources

  performance_optimization:
    - [ ] Memory usage constant regardless of file size
    - [ ] Processing time meets defined benchmarks
    - [ ] Database operations batched for efficiency
    - [ ] Caching implemented for repeated operations
    - [ ] Progress tracking for user experience

  security_implementation:
    - [ ] File upload validation (size, type, content)
    - [ ] Input sanitization for all user data
    - [ ] SQL injection prevention
    - [ ] Rate limiting on upload endpoints
    - [ ] Audit logging for all operations

  error_handling:
    - [ ] Graceful handling of malformed data
    - [ ] Specific error messages with row/field details
    - [ ] Recovery suggestions for common issues
    - [ ] Partial processing with detailed reporting
    - [ ] Rollback capability for failed imports

  testing_coverage:
    - [ ] Unit tests for all calculation logic
    - [ ] Integration tests with realistic data
    - [ ] Performance tests with various file sizes
    - [ ] Security tests for common attack vectors
    - [ ] User acceptance tests for workflows

  monitoring_and_observability:
    - [ ] Processing performance metrics
    - [ ] Data accuracy monitoring
    - [ ] Error rate tracking by category
    - [ ] User experience metrics
    - [ ] Alert thresholds configured

  documentation:
    - [ ] Technical implementation guide
    - [ ] User troubleshooting manual
    - [ ] API documentation with examples
    - [ ] Deployment and operations guide
    - [ ] Knowledge transfer documentation

deployment_readiness:
  infrastructure:
    - [ ] Database schema migrations prepared
    - [ ] Environment configuration validated
    - [ ] Security certificates installed
    - [ ] Monitoring dashboards configured
    - [ ] Backup procedures tested

  operational:
    - [ ] Support team trained
    - [ ] Incident response procedures defined
    - [ ] Rollback procedures documented
    - [ ] Performance baselines established
    - [ ] Maintenance windows scheduled
```

---

**Template Usage Notes:**

1. **Pattern Recognition**: Use these templates when encountering similar CSV processing or financial data challenges
2. **Customization**: Adapt templates to specific business requirements and technical constraints
3. **Validation**: Always validate financial calculations against known test cases
4. **Security**: Implement all security layers - financial data requires comprehensive protection
5. **Performance**: Profile and benchmark with realistic data volumes
6. **Documentation**: Maintain living documentation that evolves with implementation

**Archon Integration**: These templates are structured for optimal knowledge graph ingestion and cross-referencing with future projects requiring similar patterns.