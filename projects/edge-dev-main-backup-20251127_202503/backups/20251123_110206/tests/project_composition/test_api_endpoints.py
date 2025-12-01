"""
Comprehensive Tests for Project Composition API Endpoints

Tests all REST API functionality including:
- Project CRUD operations
- Scanner management endpoints
- Project execution endpoints
- Error handling and validation
- Authentication and authorization
- Performance and rate limiting
- API versioning and compatibility
"""

import unittest
import asyncio
import json
import tempfile
import shutil
import os
import sys
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock, AsyncMock

# Import FastAPI testing utilities
try:
    from fastapi.testclient import TestClient
    from fastapi import status
except ImportError:
    # Mock for testing environment
    class TestClient:
        def __init__(self, app): pass
    status = MagicMock()

# Import the modules to test
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))
from backend.project_composition.api_endpoints import (
    create_project_api,
    ProjectAPIError,
    ValidationError
)
from backend.project_composition.models import (
    Project,
    ProjectScanner,
    ProjectStatus,
    AggregationMethodEnum
)


class TestProjectCRUDEndpoints(unittest.TestCase):
    """Test cases for Project CRUD API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()

        # Create test FastAPI app
        self.app = create_project_api()
        self.client = TestClient(self.app)

        # Create test data
        self._create_test_data()

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def _create_test_data(self):
        """Create test data for API testing"""
        self.test_project_data = {
            "name": "Test LC Momentum Project",
            "description": "Test project for API validation",
            "aggregation_method": "weighted",
            "tags": ["test", "lc", "momentum"]
        }

        self.test_scanner_data = {
            "scanner_id": "lc_frontside_d2_extended",
            "scanner_name": "LC Frontside D2 Extended",
            "scanner_file": "generated_scanners/lc_frontside_d2_extended.py",
            "parameter_file": "params/lc_frontside_d2_extended.json",
            "weight": 0.6,
            "enabled": True
        }

        self.test_execution_config = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-30",
            "tickers": ["AAPL", "GOOGL", "MSFT"],
            "execution_name": "Test Execution"
        }

    def test_create_project_endpoint(self):
        """Test project creation endpoint"""
        # Test successful project creation
        response = self.client.post("/api/v1/projects/", json=self.test_project_data)

        self.assertEqual(response.status_code, 201)
        response_data = response.json()

        self.assertIn("id", response_data)
        self.assertEqual(response_data["name"], self.test_project_data["name"])
        self.assertEqual(response_data["description"], self.test_project_data["description"])
        self.assertEqual(response_data["aggregation_method"], self.test_project_data["aggregation_method"])

        # Store project ID for subsequent tests
        self.created_project_id = response_data["id"]

    def test_create_project_validation(self):
        """Test project creation validation"""
        # Test missing required fields
        invalid_data = {"description": "Missing name field"}

        response = self.client.post("/api/v1/projects/", json=invalid_data)
        self.assertEqual(response.status_code, 422)

        # Test invalid aggregation method
        invalid_aggregation_data = {
            "name": "Test Project",
            "aggregation_method": "invalid_method"
        }

        response = self.client.post("/api/v1/projects/", json=invalid_aggregation_data)
        self.assertEqual(response.status_code, 422)

        # Test name length validation
        too_long_name_data = {
            "name": "x" * 300,  # Exceeds maximum length
            "aggregation_method": "union"
        }

        response = self.client.post("/api/v1/projects/", json=too_long_name_data)
        self.assertEqual(response.status_code, 422)

    def test_get_project_endpoint(self):
        """Test get project endpoint"""
        # First create a project
        create_response = self.client.post("/api/v1/projects/", json=self.test_project_data)
        project_id = create_response.json()["id"]

        # Test successful retrieval
        response = self.client.get(f"/api/v1/projects/{project_id}")

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(response_data["id"], project_id)
        self.assertEqual(response_data["name"], self.test_project_data["name"])

        # Test non-existent project
        response = self.client.get("/api/v1/projects/non-existent-id")
        self.assertEqual(response.status_code, 404)

    def test_update_project_endpoint(self):
        """Test project update endpoint"""
        # Create project first
        create_response = self.client.post("/api/v1/projects/", json=self.test_project_data)
        project_id = create_response.json()["id"]

        # Test successful update
        update_data = {
            "name": "Updated Project Name",
            "description": "Updated description",
            "tags": ["updated", "test"]
        }

        response = self.client.put(f"/api/v1/projects/{project_id}", json=update_data)

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(response_data["name"], update_data["name"])
        self.assertEqual(response_data["description"], update_data["description"])
        self.assertEqual(response_data["tags"], update_data["tags"])

        # Test partial update
        partial_update = {"description": "Partially updated description"}

        response = self.client.patch(f"/api/v1/projects/{project_id}", json=partial_update)

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(response_data["description"], partial_update["description"])
        # Name should remain unchanged
        self.assertEqual(response_data["name"], update_data["name"])

    def test_delete_project_endpoint(self):
        """Test project deletion endpoint"""
        # Create project first
        create_response = self.client.post("/api/v1/projects/", json=self.test_project_data)
        project_id = create_response.json()["id"]

        # Test successful deletion
        response = self.client.delete(f"/api/v1/projects/{project_id}")
        self.assertEqual(response.status_code, 204)

        # Verify project is deleted
        response = self.client.get(f"/api/v1/projects/{project_id}")
        self.assertEqual(response.status_code, 404)

        # Test deleting non-existent project
        response = self.client.delete("/api/v1/projects/non-existent-id")
        self.assertEqual(response.status_code, 404)

    def test_list_projects_endpoint(self):
        """Test project listing endpoint"""
        # Create multiple projects
        project_data_list = [
            {"name": "Project 1", "aggregation_method": "union"},
            {"name": "Project 2", "aggregation_method": "weighted"},
            {"name": "Project 3", "aggregation_method": "intersection"}
        ]

        created_ids = []
        for project_data in project_data_list:
            response = self.client.post("/api/v1/projects/", json=project_data)
            created_ids.append(response.json()["id"])

        # Test list all projects
        response = self.client.get("/api/v1/projects/")

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertGreaterEqual(len(response_data), 3)

        # Test pagination
        response = self.client.get("/api/v1/projects/?limit=2&offset=0")
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(response.json()), 2)

        # Test filtering by status
        response = self.client.get("/api/v1/projects/?status=active")
        self.assertEqual(response.status_code, 200)

        # Test search by name
        response = self.client.get("/api/v1/projects/?search=Project 1")
        self.assertEqual(response.status_code, 200)
        results = response.json()
        self.assertTrue(any("Project 1" in project["name"] for project in results))


class TestScannerManagementEndpoints(unittest.TestCase):
    """Test cases for Scanner Management API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.app = create_project_api()
        self.client = TestClient(self.app)

        # Create test project
        project_data = {
            "name": "Test Project for Scanners",
            "aggregation_method": "weighted"
        }
        response = self.client.post("/api/v1/projects/", json=project_data)
        self.project_id = response.json()["id"]

        # Test scanner data
        self.test_scanner_data = {
            "scanner_id": "lc_frontside_d2_extended",
            "scanner_name": "LC Frontside D2 Extended",
            "scanner_file": "generated_scanners/lc_frontside_d2_extended.py",
            "parameter_file": "params/lc_frontside_d2_extended.json",
            "weight": 0.6,
            "enabled": True
        }

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def test_add_scanner_to_project(self):
        """Test adding scanner to project"""
        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=self.test_scanner_data
        )

        self.assertEqual(response.status_code, 201)
        response_data = response.json()

        self.assertIn("id", response_data)
        self.assertEqual(response_data["scanner_id"], self.test_scanner_data["scanner_id"])
        self.assertEqual(response_data["weight"], self.test_scanner_data["weight"])

    def test_add_scanner_validation(self):
        """Test scanner addition validation"""
        # Test missing required fields
        invalid_scanner_data = {"scanner_id": "test_scanner"}

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=invalid_scanner_data
        )

        self.assertEqual(response.status_code, 422)

        # Test invalid weight
        invalid_weight_data = {
            **self.test_scanner_data,
            "weight": -0.5  # Negative weight
        }

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=invalid_weight_data
        )

        self.assertEqual(response.status_code, 422)

        # Test duplicate scanner
        # First add valid scanner
        self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=self.test_scanner_data
        )

        # Try to add same scanner again
        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=self.test_scanner_data
        )

        self.assertEqual(response.status_code, 409)  # Conflict

    def test_update_scanner_configuration(self):
        """Test updating scanner configuration"""
        # Add scanner first
        add_response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=self.test_scanner_data
        )
        scanner_ref_id = add_response.json()["id"]

        # Update scanner configuration
        update_data = {
            "weight": 0.8,
            "enabled": False,
            "description": "Updated scanner description"
        }

        response = self.client.patch(
            f"/api/v1/projects/{self.project_id}/scanners/{scanner_ref_id}",
            json=update_data
        )

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(response_data["weight"], update_data["weight"])
        self.assertEqual(response_data["enabled"], update_data["enabled"])
        self.assertEqual(response_data["description"], update_data["description"])

    def test_remove_scanner_from_project(self):
        """Test removing scanner from project"""
        # Add scanner first
        add_response = self.client.post(
            f"/api/v1/projects/{self.project_id}/scanners/",
            json=self.test_scanner_data
        )
        scanner_ref_id = add_response.json()["id"]

        # Remove scanner
        response = self.client.delete(
            f"/api/v1/projects/{self.project_id}/scanners/{scanner_ref_id}"
        )

        self.assertEqual(response.status_code, 204)

        # Verify scanner is removed
        response = self.client.get(f"/api/v1/projects/{self.project_id}/scanners/")
        scanners = response.json()
        self.assertEqual(len(scanners), 0)

    def test_list_project_scanners(self):
        """Test listing scanners for a project"""
        # Add multiple scanners
        scanner_data_list = [
            {
                **self.test_scanner_data,
                "scanner_id": "scanner_1",
                "weight": 0.3
            },
            {
                **self.test_scanner_data,
                "scanner_id": "scanner_2",
                "weight": 0.4
            },
            {
                **self.test_scanner_data,
                "scanner_id": "scanner_3",
                "weight": 0.3
            }
        ]

        for scanner_data in scanner_data_list:
            self.client.post(
                f"/api/v1/projects/{self.project_id}/scanners/",
                json=scanner_data
            )

        # List all scanners
        response = self.client.get(f"/api/v1/projects/{self.project_id}/scanners/")

        self.assertEqual(response.status_code, 200)
        scanners = response.json()

        self.assertEqual(len(scanners), 3)

        # Verify weight normalization (should sum to 1.0)
        total_weight = sum(scanner["weight"] for scanner in scanners)
        self.assertAlmostEqual(total_weight, 1.0, places=2)


class TestProjectExecutionEndpoints(unittest.TestCase):
    """Test cases for Project Execution API endpoints"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_dir = tempfile.mkdtemp()
        self.app = create_project_api()
        self.client = TestClient(self.app)

        # Create test project with scanners
        self._create_test_project_with_scanners()

        # Test execution configuration
        self.test_execution_config = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-15",
            "tickers": ["AAPL", "GOOGL", "MSFT"],
            "execution_name": "Test API Execution"
        }

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.test_dir)

    def _create_test_project_with_scanners(self):
        """Create test project with scanners"""
        # Create project
        project_data = {
            "name": "Test Execution Project",
            "aggregation_method": "weighted"
        }
        response = self.client.post("/api/v1/projects/", json=project_data)
        self.project_id = response.json()["id"]

        # Add scanners
        scanner_data_list = [
            {
                "scanner_id": "scanner_1",
                "scanner_name": "Scanner 1",
                "scanner_file": "test_scanner_1.py",
                "parameter_file": "test_params_1.json",
                "weight": 0.6
            },
            {
                "scanner_id": "scanner_2",
                "scanner_name": "Scanner 2",
                "scanner_file": "test_scanner_2.py",
                "parameter_file": "test_params_2.json",
                "weight": 0.4
            }
        ]

        for scanner_data in scanner_data_list:
            self.client.post(
                f"/api/v1/projects/{self.project_id}/scanners/",
                json=scanner_data
            )

    def test_execute_project_endpoint(self):
        """Test project execution endpoint"""
        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=self.test_execution_config
        )

        self.assertEqual(response.status_code, 202)  # Accepted (async execution)
        response_data = response.json()

        self.assertIn("execution_id", response_data)
        self.assertIn("status", response_data)
        self.assertEqual(response_data["status"], "pending")

    def test_execution_validation(self):
        """Test execution parameter validation"""
        # Test invalid date range
        invalid_config = {
            **self.test_execution_config,
            "start_date": "2024-10-15",
            "end_date": "2024-10-01"  # End before start
        }

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=invalid_config
        )

        self.assertEqual(response.status_code, 422)

        # Test empty tickers list
        empty_tickers_config = {
            **self.test_execution_config,
            "tickers": []
        }

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=empty_tickers_config
        )

        self.assertEqual(response.status_code, 422)

        # Test invalid date format
        invalid_date_config = {
            **self.test_execution_config,
            "start_date": "invalid-date"
        }

        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=invalid_date_config
        )

        self.assertEqual(response.status_code, 422)

    def test_get_execution_status(self):
        """Test getting execution status"""
        # Start execution
        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=self.test_execution_config
        )
        execution_id = response.json()["execution_id"]

        # Get status
        response = self.client.get(f"/api/v1/executions/{execution_id}/status")

        self.assertEqual(response.status_code, 200)
        status_data = response.json()

        self.assertIn("status", status_data)
        self.assertIn("progress", status_data)
        self.assertIn("started_at", status_data)

    def test_get_execution_results(self):
        """Test getting execution results"""
        # Start and complete execution (mocked)
        with patch('backend.project_composition.composition_engine.CompositionEngine.execute_project') as mock_execute:
            # Mock successful execution
            mock_result = MagicMock()
            mock_result.execution_id = "test-execution-id"
            mock_result.status = "completed"
            mock_result.signals = [
                {"ticker": "AAPL", "date": "2024-10-15", "confidence": 0.8},
                {"ticker": "GOOGL", "date": "2024-10-15", "confidence": 0.75}
            ]
            mock_result.total_signals = 2
            mock_result.scanner_success_count = 2
            mock_result.scanner_error_count = 0
            mock_execute.return_value = mock_result

            response = self.client.post(
                f"/api/v1/projects/{self.project_id}/execute",
                json=self.test_execution_config
            )
            execution_id = response.json()["execution_id"]

        # Get results
        response = self.client.get(f"/api/v1/executions/{execution_id}/results")

        self.assertEqual(response.status_code, 200)
        results_data = response.json()

        self.assertIn("signals", results_data)
        self.assertIn("summary", results_data)
        self.assertIn("execution_metadata", results_data)

    def test_list_project_executions(self):
        """Test listing project executions"""
        # Start multiple executions
        execution_ids = []
        for i in range(3):
            config = {
                **self.test_execution_config,
                "execution_name": f"Test Execution {i+1}"
            }
            response = self.client.post(
                f"/api/v1/projects/{self.project_id}/execute",
                json=config
            )
            execution_ids.append(response.json()["execution_id"])

        # List executions
        response = self.client.get(f"/api/v1/projects/{self.project_id}/executions")

        self.assertEqual(response.status_code, 200)
        executions = response.json()

        self.assertGreaterEqual(len(executions), 3)

        # Test pagination
        response = self.client.get(
            f"/api/v1/projects/{self.project_id}/executions?limit=2"
        )
        self.assertEqual(response.status_code, 200)
        self.assertLessEqual(len(response.json()), 2)

    def test_cancel_execution(self):
        """Test canceling an execution"""
        # Start execution
        response = self.client.post(
            f"/api/v1/projects/{self.project_id}/execute",
            json=self.test_execution_config
        )
        execution_id = response.json()["execution_id"]

        # Cancel execution
        response = self.client.post(f"/api/v1/executions/{execution_id}/cancel")

        self.assertEqual(response.status_code, 200)
        response_data = response.json()

        self.assertEqual(response_data["status"], "cancelled")

        # Verify status is updated
        response = self.client.get(f"/api/v1/executions/{execution_id}/status")
        status_data = response.json()
        self.assertEqual(status_data["status"], "cancelled")


class TestErrorHandlingAndValidation(unittest.TestCase):
    """Test cases for API error handling and validation"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = create_project_api()
        self.client = TestClient(self.app)

    def test_404_error_handling(self):
        """Test 404 error handling"""
        # Test non-existent project
        response = self.client.get("/api/v1/projects/non-existent-id")
        self.assertEqual(response.status_code, 404)

        error_data = response.json()
        self.assertIn("detail", error_data)

        # Test non-existent execution
        response = self.client.get("/api/v1/executions/non-existent-id/status")
        self.assertEqual(response.status_code, 404)

    def test_validation_error_handling(self):
        """Test validation error handling"""
        # Invalid project data
        invalid_data = {"name": "", "aggregation_method": "invalid"}

        response = self.client.post("/api/v1/projects/", json=invalid_data)
        self.assertEqual(response.status_code, 422)

        error_data = response.json()
        self.assertIn("detail", error_data)
        self.assertIsInstance(error_data["detail"], list)

    def test_internal_error_handling(self):
        """Test internal error handling"""
        # Mock internal error
        with patch('backend.project_composition.project_config.ProjectManager.create_project') as mock_create:
            mock_create.side_effect = Exception("Internal error")

            response = self.client.post("/api/v1/projects/", json={
                "name": "Test Project",
                "aggregation_method": "union"
            })

            self.assertEqual(response.status_code, 500)

    def test_rate_limiting(self):
        """Test rate limiting (if implemented)"""
        # This would test rate limiting if implemented
        # For now, just verify endpoints respond normally
        for i in range(10):
            response = self.client.get("/api/v1/projects/")
            # Should not be rate limited for normal usage
            self.assertNotEqual(response.status_code, 429)

    def test_cors_headers(self):
        """Test CORS headers"""
        response = self.client.options("/api/v1/projects/")

        # Should include CORS headers
        self.assertIn("access-control-allow-origin", response.headers)

    def test_api_versioning(self):
        """Test API versioning"""
        # Test v1 endpoints work
        response = self.client.get("/api/v1/projects/")
        self.assertEqual(response.status_code, 200)

        # Test health check endpoint
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

        health_data = response.json()
        self.assertIn("status", health_data)
        self.assertEqual(health_data["status"], "healthy")


class TestAuthenticationAndAuthorization(unittest.TestCase):
    """Test cases for authentication and authorization (if implemented)"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = create_project_api()
        self.client = TestClient(self.app)

    def test_public_endpoints(self):
        """Test public endpoints don't require authentication"""
        # Health check should be public
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)

        # API documentation should be public
        response = self.client.get("/docs")
        self.assertEqual(response.status_code, 200)

    def test_protected_endpoints_with_auth(self):
        """Test protected endpoints with authentication (if implemented)"""
        # If authentication is implemented, test here
        # For now, endpoints are assumed to be public
        pass

    def test_authorization_levels(self):
        """Test different authorization levels (if implemented)"""
        # If role-based authorization is implemented, test here
        pass


class TestPerformanceAndScaling(unittest.TestCase):
    """Test cases for API performance and scaling"""

    def setUp(self):
        """Set up test fixtures"""
        self.app = create_project_api()
        self.client = TestClient(self.app)

    def test_response_time_performance(self):
        """Test API response time performance"""
        import time

        # Test project listing performance
        start_time = time.time()
        response = self.client.get("/api/v1/projects/")
        response_time = time.time() - start_time

        self.assertEqual(response.status_code, 200)
        self.assertLess(response_time, 2.0, "API response too slow")

    def test_concurrent_request_handling(self):
        """Test handling of concurrent requests"""
        import threading
        import time

        results = []

        def make_request():
            response = self.client.get("/api/v1/projects/")
            results.append(response.status_code)

        # Start multiple concurrent requests
        threads = []
        for _ in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all to complete
        for thread in threads:
            thread.join()

        # All should succeed
        self.assertEqual(len(results), 10)
        for status_code in results:
            self.assertEqual(status_code, 200)

    def test_large_payload_handling(self):
        """Test handling of large payloads"""
        # Test with large number of tickers
        large_execution_config = {
            "start_date": "2024-10-01",
            "end_date": "2024-10-15",
            "tickers": [f"TICKER{i:04d}" for i in range(1000)],  # 1000 tickers
            "execution_name": "Large Execution Test"
        }

        # First create a project
        project_data = {"name": "Large Test Project", "aggregation_method": "union"}
        response = self.client.post("/api/v1/projects/", json=project_data)
        project_id = response.json()["id"]

        # Test large execution request
        response = self.client.post(
            f"/api/v1/projects/{project_id}/execute",
            json=large_execution_config
        )

        # Should handle large payloads gracefully
        self.assertIn(response.status_code, [202, 413])  # Accepted or Payload Too Large


if __name__ == '__main__':
    # Run tests with detailed output
    unittest.main(verbosity=2, buffer=True)