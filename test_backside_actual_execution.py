#!/usr/bin/env python3
"""
Comprehensive Backside Scanner Execution Test

This script verifies that the actual backside scanner code is executed
through the Edge.dev platform with real Polygon API data, not fallback signals.

Test Workflow:
1. Upload the actual backside scanner code (10,697 characters)
2. Format it properly for the platform
3. Add to a project
4. Execute with Jan 1 - Nov 1, 2025 date range
5. Verify real Polygon API calls and backside algorithm execution
6. Validate results match the specific A+ para backside logic
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

class BacksideScannerExecutionTest:
    def __init__(self):
        self.base_url = "http://localhost:5657"
        self.session = requests.Session()
        self.scanner_file_path = "/Users/michaeldurante/Downloads/backside para b copy.py"
        self.project_name = f"Backside Execution Test {datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.test_results = {
            "test_started": datetime.now().isoformat(),
            "phases": {},
            "actual_execution_evidence": [],
            "fallback_detection": []
        }

    def log_evidence(self, phase, evidence_type, details):
        """Log evidence of actual execution vs fallback"""
        self.test_results["actual_execution_evidence"].append({
            "timestamp": datetime.now().isoformat(),
            "phase": phase,
            "evidence_type": evidence_type,
            "details": details
        })
        print(f"🔍 EVIDENCE [{phase}]: {evidence_type} - {details}")

    def log_fallback_suspicion(self, phase, suspicion_details):
        """Log potential fallback detection"""
        self.test_results["fallback_detection"].append({
            "timestamp": datetime.now().isoformat(),
            "phase": phase,
            "suspicion": suspicion_details
        })
        print(f"⚠️  FALLBACK SUSPICION [{phase}]: {suspicion_details}")

    def test_server_connectivity(self):
        """Test server connectivity"""
        print("🌐 Testing server connectivity...")
        try:
            response = self.session.get(f"{self.base_url}/api/health", timeout=10)
            if response.status_code == 200:
                print("✅ Server is responsive")
                self.test_results["phases"]["connectivity"] = {
                    "status": "success",
                    "timestamp": datetime.now().isoformat()
                }
                return True
            else:
                print(f"❌ Server returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to server: {e}")
            return False

    def load_actual_backside_code(self):
        """Load the actual backside scanner code"""
        print("📂 Loading actual backside scanner code...")
        try:
            with open(self.scanner_file_path, 'r') as f:
                code_content = f.read()

            code_size = len(code_content)
            print(f"📊 Loaded backside scanner: {code_size:,} characters")

            # Verify it contains the key elements of the backside scanner
            key_indicators = [
                "Fm7brz4s23eSocDErnL68cE7wspz2K1I",  # Polygon API key
                "api.polygon.io",  # Polygon API URL
                "def fetch_daily",  # Polygon fetch function
                "def _mold_on_row",  # Backside algorithm function
                "abs_top_window",  # Backside position calculation
                "MSTR','SMCI','DJT','BABA'",  # Stock universe
                "gap_div_atr_min",  # Key parameter
                "trigger_mode"  # Key parameter
            ]

            missing_indicators = []
            for indicator in key_indicators:
                if indicator not in code_content:
                    missing_indicators.append(indicator)

            if missing_indicators:
                print(f"❌ Missing key indicators: {missing_indicators}")
                return None

            print("✅ Backside scanner code verified with all key indicators")
            self.log_evidence("code_loading", "verification",
                            f"Code contains all {len(key_indicators)} key backside scanner elements")

            return code_content

        except Exception as e:
            print(f"❌ Failed to load backside scanner: {e}")
            return None

    def upload_scanner_code(self, code_content):
        """Upload the backside scanner code to the platform"""
        print("📤 Uploading backside scanner code...")

        upload_payload = {
            "scannerName": "Backside Para B Actual Execution Test",
            "description": "Testing actual execution of A+ para backside scanner with real Polygon API calls",
            "codeContent": code_content,
            "parameters": {
                "trigger_mode": "D1_or_D2",
                "atr_mult": 0.9,
                "vol_mult": 0.9,
                "d1_volume_min": 15000000,
                "gap_div_atr_min": 0.75,
                "slope5d_min": 3.0,
                "high_ema9_mult": 1.05,
                "price_min": 8.0,
                "adv20_min_usd": 30000000
            }
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/ai-agent/upload-and-format",
                json=upload_payload,
                timeout=60
            )

            print(f"📊 Upload response status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print("✅ Scanner uploaded successfully")

                # Check if the response contains actual parsed parameters
                if "extractedParameters" in result and result["extractedParameters"]:
                    param_count = len(result["extractedParameters"])
                    print(f"✅ Extracted {param_count} parameters from code")
                    self.log_evidence("upload", "parameter_extraction",
                                    f"Successfully extracted {param_count} parameters from backside code")
                else:
                    self.log_fallback_suspicion("upload", "No parameters extracted from code")

                return result
            else:
                print(f"❌ Upload failed: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Upload error: {e}")
            return None

    def create_test_project(self):
        """Create a test project"""
        print("📋 Creating test project...")

        project_payload = {
            "name": self.project_name,
            "description": "Testing actual execution of backside scanner with real Polygon API data",
            "settings": {
                "executionMode": "production",
                "dataSource": "polygon",
                "fallbackMode": "disabled"
            }
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/projects",
                json=project_payload,
                timeout=30
            )

            if response.status_code == 200:
                project = response.json()
                print(f"✅ Project created: {project.get('id', 'Unknown ID')}")
                return project
            else:
                print(f"❌ Project creation failed: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Project creation error: {e}")
            return None

    def add_scanner_to_project(self, project_id, scanner_data):
        """Add the formatted scanner to the project"""
        print("➕ Adding scanner to project...")

        add_payload = {
            "projectId": project_id,
            "scannerName": scanner_data.get("scannerName", "Backside Scanner"),
            "formattedCode": scanner_data.get("formattedCode", ""),
            "parameters": scanner_data.get("extractedParameters", {}),
            "executionConfig": {
                "dateRange": {
                    "start": "2025-01-01",
                    "end": "2025-11-01"
                },
                "universe": "backside_75_stocks",
                "executionMode": "production"
            }
        }

        try:
            response = self.session.post(
                f"{self.base_url}/api/projects/{project_id}/scanners",
                json=add_payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                print("✅ Scanner added to project")
                return result
            else:
                print(f"❌ Failed to add scanner: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Add scanner error: {e}")
            return None

    def execute_scanner_actual(self, project_id, scanner_id):
        """Execute the scanner and verify actual Polygon API calls"""
        print("🚀 Executing scanner with actual Polygon API calls...")

        execution_payload = {
            "project_id": project_id,
            "scanner_id": scanner_id,
            "execution_config": {
                "date_range": {
                    "start_date": "2025-01-01",
                    "end_date": "2025-11-01"
                },
                "parameters": {
                    "trigger_mode": "D1_or_D2",
                    "atr_mult": 0.9,
                    "vol_mult": 0.9,
                    "d1_volume_min": 15000000,
                    "gap_div_atr_min": 0.75,
                    "price_min": 8.0,
                    "adv20_min_usd": 30000000,
                    "slope5d_min": 3.0,
                    "high_ema9_mult": 1.05
                },
                "execution_mode": "production",
                "data_source": "polygon",
                "require_real_data": True
            }
        }

        try:
            print("📡 Sending execution request...")
            response = self.session.post(
                f"{self.base_url}/api/scanners/execute",
                json=execution_payload,
                timeout=120  # Allow 2 minutes for execution
            )

            print(f"📊 Execution response status: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print("✅ Scanner execution completed")

                # Analyze results for evidence of actual execution
                self.analyze_execution_results(result)

                return result
            else:
                print(f"❌ Execution failed: {response.text}")
                return None

        except Exception as e:
            print(f"❌ Execution error: {e}")
            return None

    def analyze_execution_results(self, results):
        """Analyze execution results for evidence of actual vs fallback execution"""
        print("🔍 Analyzing execution results...")

        if not results:
            self.log_fallback_suspicion("analysis", "No results returned")
            return

        # Check for real data indicators
        real_data_indicators = {
            "has_results": bool(results.get("results")),
            "has_metadata": bool(results.get("metadata")),
            "has_execution_time": bool(results.get("execution_time")),
            "has_api_calls": bool(results.get("api_call_count")),
            "result_count": 0
        }

        if results.get("results"):
            result_data = results["results"]
            if isinstance(result_data, list):
                real_data_indicators["result_count"] = len(result_data)

                # Check first result for backside-specific fields
                if result_data:
                    first_result = result_data[0]
                    backside_fields = [
                        "PosAbs_1000d", "D1_Body/ATR", "Gap/ATR",
                        "Open>PrevHigh", "D1>H(D-2)", "VolSig(max D-1,D-2)/Avg"
                    ]

                    found_backside_fields = []
                    for field in backside_fields:
                        if field in first_result:
                            found_backside_fields.append(field)

                    if found_backside_fields:
                        self.log_evidence("analysis", "backside_fields",
                                        f"Found {len(found_backside_fields)} backside-specific fields")
                        real_data_indicators["has_backside_fields"] = True
                    else:
                        self.log_fallback_suspicion("analysis", "Missing backside-specific fields")

        # Check metadata for execution evidence
        metadata = results.get("metadata", {})
        if metadata:
            if metadata.get("data_source") == "polygon":
                self.log_evidence("analysis", "data_source", "Confirmed Polygon API data source")
                real_data_indicators["polygon_confirmed"] = True

            if metadata.get("execution_mode") == "production":
                self.log_evidence("analysis", "execution_mode", "Confirmed production execution mode")
                real_data_indicators["production_mode"] = True

            if metadata.get("api_calls_made"):
                api_count = metadata["api_calls_made"]
                self.log_evidence("analysis", "api_calls", f"Made {api_count} API calls")
                real_data_indicators["api_calls_confirmed"] = True

        # Overall assessment
        positive_indicators = sum(1 for v in real_data_indicators.values() if v is True)
        total_checks = len([k for k in real_data_indicators.keys() if k != "result_count"])

        execution_confidence = positive_indicators / total_checks if total_checks > 0 else 0

        print(f"📊 Execution Analysis Results:")
        print(f"   Positive Indicators: {positive_indicators}/{total_checks}")
        print(f"   Execution Confidence: {execution_confidence:.1%}")
        print(f"   Result Count: {real_data_indicators['result_count']}")

        if execution_confidence > 0.7:
            print("✅ HIGH CONFIDENCE: Actual execution detected")
            self.log_evidence("analysis", "overall_assessment",
                            f"High confidence ({execution_confidence:.1%}) actual execution")
        elif execution_confidence > 0.4:
            print("⚠️  MEDIUM CONFIDENCE: Possible actual execution")
            self.log_evidence("analysis", "overall_assessment",
                            f"Medium confidence ({execution_confidence:.1%}) actual execution")
        else:
            print("❌ LOW CONFIDENCE: Likely fallback execution")
            self.log_fallback_suspicion("analysis",
                                      f"Low confidence ({execution_confidence:.1%}) suggests fallback")

        self.test_results["phases"]["analysis"] = {
            "indicators": real_data_indicators,
            "confidence": execution_confidence,
            "timestamp": datetime.now().isoformat()
        }

    def verify_polygon_api_integration(self, results):
        """Verify that Polygon API was actually called"""
        print("🌐 Verifying Polygon API integration...")

        if not results:
            self.log_fallback_suspicion("polygon_verification", "No results to verify")
            return False

        # Check for Polygon-specific evidence
        polygon_evidence = []

        # 1. Check for real stock data
        if results.get("results"):
            result_data = results["results"]
            if isinstance(result_data, list) and len(result_data) > 0:
                first_result = result_data[0]

                # Look for realistic price ranges
                price_fields = []
                for field in ["Close", "High", "Low", "Open"]:
                    if field in first_result and isinstance(first_result[field], (int, float)):
                        price = first_result[field]
                        if 1 < price < 10000:  # Reasonable stock price range
                            price_fields.append(field)

                if price_fields:
                    polygon_evidence.append(f"Realistic price data in {len(price_fields)} fields")
                    self.log_evidence("polygon_verification", "price_data",
                                    f"Found realistic prices in {price_fields}")

        # 2. Check for volume data
        if results.get("results"):
            first_result = results["results"][0] if isinstance(results["results"], list) else None
            if first_result:
                volume_indicators = ["Volume", "D1Vol(shares)", "ADV20_$"]
                found_volumes = []

                for vol_field in volume_indicators:
                    if vol_field in first_result:
                        vol_value = first_result[vol_field]
                        if isinstance(vol_value, (int, float)) and vol_value > 1000:
                            found_volumes.append(vol_field)

                if found_volumes:
                    polygon_evidence.append(f"Realistic volume data in {found_volumes}")
                    self.log_evidence("polygon_verification", "volume_data",
                                    f"Found realistic volumes in {found_volumes}")

        # 3. Check execution metadata
        metadata = results.get("metadata", {})
        if metadata:
            if metadata.get("data_source") == "polygon":
                polygon_evidence.append("Confirmed Polygon data source in metadata")

            if metadata.get("polygon_api_calls"):
                api_calls = metadata["polygon_api_calls"]
                if api_calls > 0:
                    polygon_evidence.append(f"Made {api_calls} Polygon API calls")
                    self.log_evidence("polygon_verification", "api_calls",
                                    f"Polygon API calls: {api_calls}")

            if metadata.get("symbols_processed"):
                symbols = metadata["symbols_processed"]
                if symbols >= 70:  # Should be close to the 75 in the universe
                    polygon_evidence.append(f"Processed {symbols} symbols from universe")
                    self.log_evidence("polygon_verification", "symbol_coverage",
                                    f"Processed {symbols} symbols")

        # Assessment
        if len(polygon_evidence) >= 2:
            print("✅ Polygon API integration verified")
            print(f"   Evidence: {polygon_evidence}")
            return True
        else:
            print("⚠️  Limited Polygon API evidence")
            print(f"   Evidence: {polygon_evidence}")
            self.log_fallback_suspicion("polygon_verification",
                                      f"Limited evidence: {polygon_evidence}")
            return False

    def run_comprehensive_test(self):
        """Run the complete comprehensive test"""
        print("🧪 Starting Comprehensive Backside Scanner Execution Test")
        print("=" * 60)

        # Phase 1: Connectivity
        if not self.test_server_connectivity():
            return False

        # Phase 2: Load actual code
        code_content = self.load_actual_backside_code()
        if not code_content:
            return False

        # Phase 3: Upload code
        upload_result = self.upload_scanner_code(code_content)
        if not upload_result:
            return False

        # Phase 4: Create project
        project = self.create_test_project()
        if not project:
            return False

        # Phase 5: Add scanner to project
        add_result = self.add_scanner_to_project(project["id"], upload_result)
        if not add_result:
            return False

        # Phase 6: Execute scanner
        execution_results = self.execute_scanner_actual(project["id"], add_result["scannerId"])
        if not execution_results:
            return False

        # Phase 7: Analyze results
        self.analyze_execution_results(execution_results)

        # Phase 8: Verify Polygon integration
        polygon_verified = self.verify_polygon_api_integration(execution_results)

        # Final assessment
        print("\n" + "=" * 60)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 60)

        self.test_results["test_completed"] = datetime.now().isoformat()
        self.test_results["final_assessment"] = {
            "upload_successful": bool(upload_result),
            "project_created": bool(project),
            "execution_successful": bool(execution_results),
            "polygon_verified": polygon_verified,
            "evidence_count": len(self.test_results["actual_execution_evidence"]),
            "fallback_suspicions": len(self.test_results["fallback_detection"])
        }

        # Print summary
        evidence_count = len(self.test_results["actual_execution_evidence"])
        suspicion_count = len(self.test_results["fallback_detection"])

        print(f"✅ Actual Execution Evidence: {evidence_count} points")
        print(f"⚠️  Fallback Suspicions: {suspicion_count} points")

        if evidence_count >= 5 and suspicion_count <= 1:
            print("🎯 CONCLUSION: ACTUAL EXECUTION CONFIRMED")
            print("   The backside scanner was executed with real Polygon API data")
        elif evidence_count >= 3:
            print("🟡 CONCLUSION: LIKELY ACTUAL EXECUTION")
            print("   Evidence suggests actual execution with some uncertainty")
        else:
            print("❌ CONCLUSION: LIKELY FALLBACK EXECUTION")
            print("   Evidence suggests fallback or test data was used")

        # Save detailed results
        results_file = f"/tmp/backside_execution_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(results_file, 'w') as f:
                json.dump(self.test_results, f, indent=2)
            print(f"📄 Detailed results saved to: {results_file}")
        except Exception as e:
            print(f"⚠️  Could not save results file: {e}")

        return evidence_count >= 3

if __name__ == "__main__":
    tester = BacksideScannerExecutionTest()
    success = tester.run_comprehensive_test()
    exit(0 if success else 1)