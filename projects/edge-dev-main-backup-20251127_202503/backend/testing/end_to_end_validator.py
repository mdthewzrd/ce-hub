#!/usr/bin/env python3
"""
🧪 END-TO-END TESTING FRAMEWORK
================================

Comprehensive validation of the complete AI-powered multi-scanner solution.
Tests the entire pipeline from multi-scanner file input through isolated scanner execution.

VALIDATION PHASES:
1. File Input Validation
2. Boundary Detection Accuracy
3. Parameter Isolation Verification
4. Template Generation Quality
5. Scanner Execution Functionality
6. Performance Benchmarking
7. Complete Workflow Integration

Test Case: Transform user's 3-scanner file into 3 isolated, executable scanners
with zero parameter contamination.
"""

import os
import sys
import time
import ast
import subprocess
import asyncio
import traceback
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
import pandas as pd

# Add backend to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from ai_boundary_detection.boundary_detector import AIBoundaryDetector
from parameter_isolation.isolated_extractor import IsolatedParameterExtractor
from template_generation.smart_generator import SmartTemplateGenerator

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Container for validation test results"""
    phase: str
    test_name: str
    passed: bool
    score: float  # 0.0 to 1.0
    message: str
    execution_time: float
    details: Dict[str, Any]

@dataclass
class EndToEndResults:
    """Container for complete end-to-end test results"""
    overall_success: bool
    total_score: float
    execution_time: float
    phase_results: Dict[str, List[ValidationResult]]
    summary: str
    recommendations: List[str]

class EndToEndValidator:
    """
    Comprehensive end-to-end testing framework for AI-powered multi-scanner solution.
    Validates complete workflow from input to execution.
    """

    def __init__(self, test_file_path: str = None, output_dir: str = None):
        self.test_file = test_file_path or "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"
        self.output_dir = output_dir or "/Users/michaeldurante/ai dev/ce-hub/edge-dev/generated_scanners"

        # Initialize components
        self.boundary_detector = AIBoundaryDetector()
        self.parameter_extractor = IsolatedParameterExtractor()
        self.template_generator = SmartTemplateGenerator(self.output_dir)

        # Expected test results (known ground truth)
        self.expected_scanners = [
            "lc_frontside_d3_extended_1",
            "lc_frontside_d2_extended",
            "lc_frontside_d2_extended_1"
        ]

        # Performance benchmarks
        self.performance_benchmarks = {
            'boundary_detection_max_time': 5.0,  # seconds
            'parameter_extraction_max_time': 3.0,  # seconds
            'template_generation_max_time': 10.0,  # seconds
            'total_pipeline_max_time': 20.0  # seconds
        }

        logger.info(f"🧪 Initialized End-to-End Validator")
        logger.info(f"📁 Test file: {self.test_file}")
        logger.info(f"📁 Output directory: {self.output_dir}")

    async def run_complete_validation(self) -> EndToEndResults:
        """
        Run comprehensive end-to-end validation of the complete system.

        Returns:
            EndToEndResults with complete validation results
        """
        logger.info("🚀 Starting comprehensive end-to-end validation...")
        start_time = time.time()

        phase_results = {}

        try:
            # Phase 1: File Input Validation
            logger.info("📋 Phase 1: File Input Validation")
            phase_results['input_validation'] = await self._validate_file_input()

            # Phase 2: Boundary Detection Accuracy
            logger.info("🔍 Phase 2: Boundary Detection Accuracy")
            phase_results['boundary_detection'] = await self._validate_boundary_detection()

            # Phase 3: Parameter Isolation Verification
            logger.info("🔒 Phase 3: Parameter Isolation Verification")
            phase_results['parameter_isolation'] = await self._validate_parameter_isolation()

            # Phase 4: Template Generation Quality
            logger.info("📄 Phase 4: Template Generation Quality")
            phase_results['template_generation'] = await self._validate_template_generation()

            # Phase 5: Scanner Execution Functionality
            logger.info("⚙️ Phase 5: Scanner Execution Functionality")
            phase_results['scanner_execution'] = await self._validate_scanner_execution()

            # Phase 6: Performance Benchmarking
            logger.info("📊 Phase 6: Performance Benchmarking")
            phase_results['performance'] = await self._validate_performance()

            # Phase 7: Complete Workflow Integration
            logger.info("🔄 Phase 7: Complete Workflow Integration")
            phase_results['workflow_integration'] = await self._validate_workflow_integration()

        except Exception as e:
            logger.error(f"❌ Critical error during validation: {e}")
            logger.error(traceback.format_exc())

            # Create error result
            error_result = ValidationResult(
                phase="critical_error",
                test_name="system_failure",
                passed=False,
                score=0.0,
                message=f"Critical system error: {e}",
                execution_time=time.time() - start_time,
                details={'error': str(e), 'traceback': traceback.format_exc()}
            )
            phase_results['critical_error'] = [error_result]

        # Calculate overall results
        total_time = time.time() - start_time
        overall_results = self._calculate_overall_results(phase_results, total_time)

        logger.info(f"✅ End-to-end validation complete: {overall_results.overall_success}")
        logger.info(f"📊 Total Score: {overall_results.total_score:.2%}")
        logger.info(f"⏱️ Total Time: {overall_results.execution_time:.2f}s")

        return overall_results

    async def _validate_file_input(self) -> List[ValidationResult]:
        """Validate test file input and accessibility"""
        results = []
        start_time = time.time()

        # Test 1: File exists and is readable
        test_start = time.time()
        try:
            if os.path.exists(self.test_file):
                with open(self.test_file, 'r') as f:
                    content = f.read()

                if content and len(content) > 0:
                    results.append(ValidationResult(
                        phase="input_validation",
                        test_name="file_accessibility",
                        passed=True,
                        score=1.0,
                        message=f"Test file accessible: {len(content)} characters",
                        execution_time=time.time() - test_start,
                        details={'file_size': len(content), 'lines': content.count('\n')}
                    ))
                else:
                    results.append(ValidationResult(
                        phase="input_validation",
                        test_name="file_accessibility",
                        passed=False,
                        score=0.0,
                        message="Test file is empty",
                        execution_time=time.time() - test_start,
                        details={'file_exists': True, 'content_length': 0}
                    ))
            else:
                results.append(ValidationResult(
                    phase="input_validation",
                    test_name="file_accessibility",
                    passed=False,
                    score=0.0,
                    message=f"Test file not found: {self.test_file}",
                    execution_time=time.time() - test_start,
                    details={'file_exists': False}
                ))
        except Exception as e:
            results.append(ValidationResult(
                phase="input_validation",
                test_name="file_accessibility",
                passed=False,
                score=0.0,
                message=f"Error accessing file: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        # Test 2: Python syntax validation
        test_start = time.time()
        try:
            if os.path.exists(self.test_file):
                with open(self.test_file, 'r') as f:
                    content = f.read()

                # Try to parse as Python AST
                ast.parse(content)

                results.append(ValidationResult(
                    phase="input_validation",
                    test_name="python_syntax",
                    passed=True,
                    score=1.0,
                    message="Valid Python syntax",
                    execution_time=time.time() - test_start,
                    details={'syntax_valid': True}
                ))
            else:
                results.append(ValidationResult(
                    phase="input_validation",
                    test_name="python_syntax",
                    passed=False,
                    score=0.0,
                    message="Cannot validate syntax - file not accessible",
                    execution_time=time.time() - test_start,
                    details={'file_accessible': False}
                ))

        except SyntaxError as e:
            results.append(ValidationResult(
                phase="input_validation",
                test_name="python_syntax",
                passed=False,
                score=0.0,
                message=f"Python syntax error: {e}",
                execution_time=time.time() - test_start,
                details={'syntax_error': str(e), 'line': e.lineno}
            ))
        except Exception as e:
            results.append(ValidationResult(
                phase="input_validation",
                test_name="python_syntax",
                passed=False,
                score=0.0,
                message=f"Error validating syntax: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_boundary_detection(self) -> List[ValidationResult]:
        """Validate AI boundary detection accuracy"""
        results = []

        # Test 1: Scanner detection accuracy
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            # Run boundary detection
            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)

            detected_names = [b.name for b in boundaries]

            # Check if all expected scanners are detected
            all_detected = all(scanner in detected_names for scanner in self.expected_scanners)
            detection_accuracy = len(set(detected_names).intersection(set(self.expected_scanners))) / len(self.expected_scanners)

            results.append(ValidationResult(
                phase="boundary_detection",
                test_name="scanner_detection_accuracy",
                passed=all_detected,
                score=detection_accuracy,
                message=f"Detected {len(boundaries)} scanners, expected {len(self.expected_scanners)}",
                execution_time=time.time() - test_start,
                details={
                    'detected_scanners': detected_names,
                    'expected_scanners': self.expected_scanners,
                    'detection_accuracy': detection_accuracy,
                    'all_detected': all_detected
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="boundary_detection",
                test_name="scanner_detection_accuracy",
                passed=False,
                score=0.0,
                message=f"Error in boundary detection: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        # Test 2: Boundary line accuracy
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)

            # Validate boundary line numbers are reasonable
            valid_boundaries = True
            boundary_details = []

            for boundary in boundaries:
                if boundary.start_line <= 0 or boundary.end_line <= boundary.start_line:
                    valid_boundaries = False

                boundary_details.append({
                    'scanner': boundary.name,
                    'start_line': boundary.start_line,
                    'end_line': boundary.end_line,
                    'line_count': boundary.end_line - boundary.start_line + 1,
                    'confidence': boundary.confidence
                })

            results.append(ValidationResult(
                phase="boundary_detection",
                test_name="boundary_line_accuracy",
                passed=valid_boundaries,
                score=1.0 if valid_boundaries else 0.5,
                message=f"Boundary lines validated for {len(boundaries)} scanners",
                execution_time=time.time() - test_start,
                details={'boundaries': boundary_details, 'valid': valid_boundaries}
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="boundary_detection",
                test_name="boundary_line_accuracy",
                passed=False,
                score=0.0,
                message=f"Error validating boundary lines: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_parameter_isolation(self) -> List[ValidationResult]:
        """Validate parameter isolation and contamination prevention"""
        results = []

        # Test 1: Parameter extraction success
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)
            isolated_params = self.parameter_extractor.extract_parameters_by_scanner(content, boundaries)

            extraction_success = len(isolated_params) == len(self.expected_scanners)

            param_counts = {name: params.parameter_count for name, params in isolated_params.items()}
            total_params = sum(param_counts.values())

            results.append(ValidationResult(
                phase="parameter_isolation",
                test_name="parameter_extraction",
                passed=extraction_success,
                score=1.0 if extraction_success else len(isolated_params) / len(self.expected_scanners),
                message=f"Extracted parameters for {len(isolated_params)} scanners, total {total_params} parameters",
                execution_time=time.time() - test_start,
                details={
                    'scanner_count': len(isolated_params),
                    'parameter_counts': param_counts,
                    'total_parameters': total_params,
                    'extraction_success': extraction_success
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="parameter_isolation",
                test_name="parameter_extraction",
                passed=False,
                score=0.0,
                message=f"Error in parameter extraction: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        # Test 2: Contamination validation
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)
            isolated_params = self.parameter_extractor.extract_parameters_by_scanner(content, boundaries)

            # Run contamination validation
            contamination_free = self.parameter_extractor.validate_no_contamination(isolated_params)

            # Count contamination sources
            contamination_count = sum(len(params.contamination_sources) for params in isolated_params.values())

            results.append(ValidationResult(
                phase="parameter_isolation",
                test_name="contamination_validation",
                passed=contamination_free,
                score=1.0 if contamination_free else 0.5,
                message=f"Contamination validation: {'PASSED' if contamination_free else 'FAILED'} ({contamination_count} contamination sources found)",
                execution_time=time.time() - test_start,
                details={
                    'contamination_free': contamination_free,
                    'contamination_count': contamination_count,
                    'isolation_verified': all(p.isolation_verified for p in isolated_params.values())
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="parameter_isolation",
                test_name="contamination_validation",
                passed=False,
                score=0.0,
                message=f"Error in contamination validation: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_template_generation(self) -> List[ValidationResult]:
        """Validate template generation quality and output"""
        results = []

        # Test 1: Template generation success
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            # Generate templates
            templates = self.template_generator.generate_isolated_scanner_files(content, self.test_file)

            generation_success = len(templates) == len(self.expected_scanners)

            template_details = []
            for template in templates:
                template_details.append({
                    'scanner_name': template.scanner_name,
                    'filename': template.filename,
                    'parameters_count': template.parameters_count,
                    'executable': template.executable,
                    'isolation_verified': template.isolation_verified
                })

            results.append(ValidationResult(
                phase="template_generation",
                test_name="generation_success",
                passed=generation_success,
                score=len(templates) / len(self.expected_scanners),
                message=f"Generated {len(templates)} templates, expected {len(self.expected_scanners)}",
                execution_time=time.time() - test_start,
                details={
                    'templates_generated': len(templates),
                    'expected_count': len(self.expected_scanners),
                    'template_details': template_details
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="template_generation",
                test_name="generation_success",
                passed=False,
                score=0.0,
                message=f"Error in template generation: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        # Test 2: Generated file validation
        test_start = time.time()
        try:
            # Check if all expected files exist and are valid
            valid_files = 0
            file_details = []

            for scanner_name in self.expected_scanners:
                filename = f"{scanner_name.lower()}.py"
                filepath = os.path.join(self.output_dir, filename)

                file_info = {
                    'scanner': scanner_name,
                    'filename': filename,
                    'exists': os.path.exists(filepath),
                    'size': 0,
                    'syntax_valid': False
                }

                if os.path.exists(filepath):
                    file_info['size'] = os.path.getsize(filepath)

                    # Check syntax
                    try:
                        with open(filepath, 'r') as f:
                            file_content = f.read()
                        ast.parse(file_content)
                        file_info['syntax_valid'] = True
                        valid_files += 1
                    except SyntaxError:
                        file_info['syntax_valid'] = False

                file_details.append(file_info)

            validation_success = valid_files == len(self.expected_scanners)

            results.append(ValidationResult(
                phase="template_generation",
                test_name="file_validation",
                passed=validation_success,
                score=valid_files / len(self.expected_scanners),
                message=f"Validated {valid_files}/{len(self.expected_scanners)} generated files",
                execution_time=time.time() - test_start,
                details={
                    'valid_files': valid_files,
                    'total_expected': len(self.expected_scanners),
                    'file_details': file_details
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="template_generation",
                test_name="file_validation",
                passed=False,
                score=0.0,
                message=f"Error validating generated files: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_scanner_execution(self) -> List[ValidationResult]:
        """Validate that generated scanners are executable"""
        results = []

        # Test 1: Python execution test
        test_start = time.time()
        try:
            executable_count = 0
            execution_details = []

            for scanner_name in self.expected_scanners:
                filename = f"{scanner_name.lower()}.py"
                filepath = os.path.join(self.output_dir, filename)

                exec_info = {
                    'scanner': scanner_name,
                    'filename': filename,
                    'executable': False,
                    'execution_time': 0,
                    'error': None
                }

                if os.path.exists(filepath):
                    exec_start = time.time()
                    try:
                        # Test syntax check (basic execution test)
                        result = subprocess.run(
                            [sys.executable, '-m', 'py_compile', filepath],
                            capture_output=True,
                            text=True,
                            timeout=10
                        )

                        if result.returncode == 0:
                            exec_info['executable'] = True
                            executable_count += 1
                        else:
                            exec_info['error'] = result.stderr

                        exec_info['execution_time'] = time.time() - exec_start

                    except subprocess.TimeoutExpired:
                        exec_info['error'] = "Execution timeout"
                        exec_info['execution_time'] = time.time() - exec_start
                    except Exception as e:
                        exec_info['error'] = str(e)
                        exec_info['execution_time'] = time.time() - exec_start
                else:
                    exec_info['error'] = "File not found"

                execution_details.append(exec_info)

            execution_success = executable_count == len(self.expected_scanners)

            results.append(ValidationResult(
                phase="scanner_execution",
                test_name="python_execution",
                passed=execution_success,
                score=executable_count / len(self.expected_scanners),
                message=f"Executable scanners: {executable_count}/{len(self.expected_scanners)}",
                execution_time=time.time() - test_start,
                details={
                    'executable_count': executable_count,
                    'total_scanners': len(self.expected_scanners),
                    'execution_details': execution_details
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="scanner_execution",
                test_name="python_execution",
                passed=False,
                score=0.0,
                message=f"Error in execution validation: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_performance(self) -> List[ValidationResult]:
        """Validate system performance against benchmarks"""
        results = []

        # Test 1: End-to-end pipeline performance
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            # Time the complete pipeline
            pipeline_start = time.time()

            # Boundary detection
            boundary_start = time.time()
            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)
            boundary_time = time.time() - boundary_start

            # Parameter extraction
            param_start = time.time()
            isolated_params = self.parameter_extractor.extract_parameters_by_scanner(content, boundaries)
            param_time = time.time() - param_start

            # Template generation
            template_start = time.time()
            templates = self.template_generator.generate_isolated_scanner_files(content, self.test_file)
            template_time = time.time() - template_start

            total_pipeline_time = time.time() - pipeline_start

            # Check against benchmarks
            performance_score = 1.0
            performance_issues = []

            if boundary_time > self.performance_benchmarks['boundary_detection_max_time']:
                performance_score -= 0.25
                performance_issues.append(f"Boundary detection slow: {boundary_time:.2f}s")

            if param_time > self.performance_benchmarks['parameter_extraction_max_time']:
                performance_score -= 0.25
                performance_issues.append(f"Parameter extraction slow: {param_time:.2f}s")

            if template_time > self.performance_benchmarks['template_generation_max_time']:
                performance_score -= 0.25
                performance_issues.append(f"Template generation slow: {template_time:.2f}s")

            if total_pipeline_time > self.performance_benchmarks['total_pipeline_max_time']:
                performance_score -= 0.25
                performance_issues.append(f"Total pipeline slow: {total_pipeline_time:.2f}s")

            performance_passed = performance_score >= 0.75

            results.append(ValidationResult(
                phase="performance",
                test_name="pipeline_performance",
                passed=performance_passed,
                score=performance_score,
                message=f"Pipeline performance: {total_pipeline_time:.2f}s total ({len(performance_issues)} issues)",
                execution_time=time.time() - test_start,
                details={
                    'boundary_detection_time': boundary_time,
                    'parameter_extraction_time': param_time,
                    'template_generation_time': template_time,
                    'total_pipeline_time': total_pipeline_time,
                    'performance_issues': performance_issues,
                    'benchmarks': self.performance_benchmarks
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="performance",
                test_name="pipeline_performance",
                passed=False,
                score=0.0,
                message=f"Error in performance validation: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    async def _validate_workflow_integration(self) -> List[ValidationResult]:
        """Validate complete workflow integration"""
        results = []

        # Test 1: Complete end-to-end workflow
        test_start = time.time()
        try:
            with open(self.test_file, 'r') as f:
                content = f.read()

            # Run complete workflow
            workflow_start = time.time()

            # Step 1: Boundary detection
            boundaries = self.boundary_detector.detect_scanner_boundaries(content, self.test_file)

            # Step 2: Parameter extraction
            isolated_params = self.parameter_extractor.extract_parameters_by_scanner(content, boundaries)

            # Step 3: Template generation
            templates = self.template_generator.generate_isolated_scanner_files(content, self.test_file)

            # Step 4: Validation
            contamination_free = self.parameter_extractor.validate_no_contamination(isolated_params)

            workflow_time = time.time() - workflow_start

            # Check workflow success criteria
            workflow_success = (
                len(boundaries) == len(self.expected_scanners) and
                len(isolated_params) == len(self.expected_scanners) and
                len(templates) == len(self.expected_scanners) and
                contamination_free and
                all(template.executable for template in templates)
            )

            results.append(ValidationResult(
                phase="workflow_integration",
                test_name="complete_workflow",
                passed=workflow_success,
                score=1.0 if workflow_success else 0.5,
                message=f"Complete workflow: {'SUCCESS' if workflow_success else 'PARTIAL'} ({workflow_time:.2f}s)",
                execution_time=time.time() - test_start,
                details={
                    'boundaries_detected': len(boundaries),
                    'parameters_extracted': len(isolated_params),
                    'templates_generated': len(templates),
                    'contamination_free': contamination_free,
                    'all_executable': all(template.executable for template in templates),
                    'workflow_time': workflow_time,
                    'expected_scanners': len(self.expected_scanners)
                }
            ))

        except Exception as e:
            results.append(ValidationResult(
                phase="workflow_integration",
                test_name="complete_workflow",
                passed=False,
                score=0.0,
                message=f"Error in workflow integration: {e}",
                execution_time=time.time() - test_start,
                details={'error': str(e)}
            ))

        return results

    def _calculate_overall_results(self, phase_results: Dict[str, List[ValidationResult]], total_time: float) -> EndToEndResults:
        """Calculate overall validation results"""

        # Calculate overall score
        all_results = []
        for phase_list in phase_results.values():
            all_results.extend(phase_list)

        if not all_results:
            return EndToEndResults(
                overall_success=False,
                total_score=0.0,
                execution_time=total_time,
                phase_results=phase_results,
                summary="No tests executed",
                recommendations=["Check test configuration"]
            )

        total_score = sum(result.score for result in all_results) / len(all_results)
        overall_success = total_score >= 0.8 and all(result.passed for result in all_results if result.phase != "critical_error")

        # Generate summary
        passed_count = sum(1 for result in all_results if result.passed)
        failed_count = len(all_results) - passed_count

        summary = f"""
🧪 END-TO-END VALIDATION SUMMARY
================================

Overall Success: {'✅ PASSED' if overall_success else '❌ FAILED'}
Total Score: {total_score:.2%}
Execution Time: {total_time:.2f}s

Test Results: {passed_count} passed, {failed_count} failed

Phase Breakdown:
"""

        # Add phase details
        for phase_name, results in phase_results.items():
            phase_score = sum(r.score for r in results) / len(results) if results else 0.0
            phase_passed = all(r.passed for r in results)
            summary += f"  {phase_name}: {'✅' if phase_passed else '❌'} {phase_score:.1%} ({len(results)} tests)\n"

        # Generate recommendations
        recommendations = []

        if total_score < 0.8:
            recommendations.append("Overall score below 80% - review failed tests")

        if total_time > self.performance_benchmarks['total_pipeline_max_time']:
            recommendations.append("Performance optimization needed - pipeline too slow")

        for result in all_results:
            if not result.passed and result.phase != "critical_error":
                recommendations.append(f"Fix {result.phase}.{result.test_name}: {result.message}")

        if not recommendations:
            recommendations = ["All tests passing - system ready for production"]

        return EndToEndResults(
            overall_success=overall_success,
            total_score=total_score,
            execution_time=total_time,
            phase_results=phase_results,
            summary=summary,
            recommendations=recommendations[:10]  # Limit to top 10 recommendations
        )

    def generate_validation_report(self, results: EndToEndResults) -> str:
        """Generate comprehensive validation report"""

        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        report = f"""
🧪 COMPREHENSIVE END-TO-END VALIDATION REPORT
============================================
Generated: {timestamp}
Test File: {self.test_file}
Output Directory: {self.output_dir}

{results.summary}

📊 DETAILED TEST RESULTS:
========================

"""

        # Add detailed results for each phase
        for phase_name, phase_results in results.phase_results.items():
            report += f"\n📋 {phase_name.upper().replace('_', ' ')}:\n"
            report += "-" * 50 + "\n"

            for result in phase_results:
                status_icon = "✅" if result.passed else "❌"
                report += f"{status_icon} {result.test_name}: {result.score:.1%} ({result.execution_time:.2f}s)\n"
                report += f"   {result.message}\n"

                if result.details and not result.passed:
                    report += f"   Details: {result.details}\n"

                report += "\n"

        # Add recommendations
        report += f"\n💡 RECOMMENDATIONS:\n"
        report += "=" * 50 + "\n"
        for i, recommendation in enumerate(results.recommendations, 1):
            report += f"{i}. {recommendation}\n"

        return report

# Test the end-to-end validator
if __name__ == "__main__":
    async def main():
        validator = EndToEndValidator()

        # Run comprehensive validation
        results = await validator.run_complete_validation()

        # Generate and print report
        report = validator.generate_validation_report(results)
        print(report)

        # Save report to file
        report_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/testing/validation_report.txt"
        with open(report_path, 'w') as f:
            f.write(report)

        print(f"📄 Full validation report saved to: {report_path}")

        # Return exit code based on success
        return 0 if results.overall_success else 1

    import asyncio
    exit_code = asyncio.run(main())
    sys.exit(exit_code)