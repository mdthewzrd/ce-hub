"""
Unit Tests for Project Configuration System

Tests the core project configuration functionality including:
- Project creation and validation
- Scanner reference management
- Configuration persistence
- Isolation validation
- Project CRUD operations
"""

import unittest
import tempfile
import shutil
import json
import os
from datetime import datetime
from pathlib import Path
from unittest.mock import patch, MagicMock

# Import the modules to test
from backend.project_composition.project_config import (
    ProjectConfig,
    ScannerReference,
    AggregationMethod,
    ProjectManager,
    ExecutionConfig
)


class TestScannerReference(unittest.TestCase):
    """Test ScannerReference functionality"""

    def test_scanner_reference_creation(self):
        """Test creating a valid scanner reference"""
        ref = ScannerReference(
            scanner_id="test_scanner",
            scanner_file="/path/to/scanner.py",
            parameter_file="/path/to/params.json"
        )

        self.assertEqual(ref.scanner_id, "test_scanner")
        self.assertEqual(ref.scanner_file, "/path/to/scanner.py")
        self.assertEqual(ref.parameter_file, "/path/to/params.json")
        self.assertTrue(ref.enabled)
        self.assertEqual(ref.weight, 1.0)
        self.assertEqual(ref.order_index, 0)

    def test_scanner_reference_validation(self):
        """Test scanner reference validation"""
        # Test empty scanner ID
        with self.assertRaises(ValueError):
            ScannerReference(
                scanner_id="",
                scanner_file="/path/to/scanner.py",
                parameter_file="/path/to/params.json"
            )

        # Test empty scanner file
        with self.assertRaises(ValueError):
            ScannerReference(
                scanner_id="test",
                scanner_file="",
                parameter_file="/path/to/params.json"
            )

        # Test negative weight
        with self.assertRaises(ValueError):
            ScannerReference(
                scanner_id="test",
                scanner_file="/path/to/scanner.py",
                parameter_file="/path/to/params.json",
                weight=-1.0
            )

    def test_scanner_reference_custom_values(self):
        """Test scanner reference with custom values"""
        ref = ScannerReference(
            scanner_id="custom_scanner",
            scanner_file="/custom/path.py",
            parameter_file="/custom/params.json",
            enabled=False,
            weight=2.5,
            order_index=3
        )

        self.assertFalse(ref.enabled)
        self.assertEqual(ref.weight, 2.5)
        self.assertEqual(ref.order_index, 3)


class TestProjectConfig(unittest.TestCase):
    """Test ProjectConfig functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.test_scanner_file = os.path.join(self.temp_dir, "test_scanner.py")
        self.test_param_file = os.path.join(self.temp_dir, "test_params.json")

        # Create dummy scanner file
        with open(self.test_scanner_file, 'w') as f:
            f.write("# Test scanner file\nclass TestScanner:\n    pass\n")

        # Create dummy parameter file
        with open(self.test_param_file, 'w') as f:
            json.dump({"param1": 1.0, "param2": "test"}, f)

        self.test_scanner = ScannerReference(
            scanner_id="test_scanner",
            scanner_file=self.test_scanner_file,
            parameter_file=self.test_param_file
        )

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_project_creation(self):
        """Test creating a valid project"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        self.assertEqual(config.project_id, "test_project")
        self.assertEqual(config.name, "Test Project")
        self.assertEqual(config.description, "A test project")
        self.assertEqual(len(config.scanners), 1)
        self.assertEqual(config.aggregation_method, AggregationMethod.UNION)

    def test_project_auto_id_generation(self):
        """Test automatic project ID generation"""
        config = ProjectConfig(
            project_id="",  # Empty ID should be auto-generated
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        self.assertNotEqual(config.project_id, "")
        self.assertIsNotNone(config.project_id)

    def test_project_validation_empty_name(self):
        """Test project validation with empty name"""
        with self.assertRaises(ValueError):
            ProjectConfig(
                project_id="test_project",
                name="",
                description="A test project",
                scanners=[self.test_scanner]
            )

    def test_project_validation_no_scanners(self):
        """Test project validation with no scanners"""
        with self.assertRaises(ValueError):
            ProjectConfig(
                project_id="test_project",
                name="Test Project",
                description="A test project",
                scanners=[]
            )

    def test_project_validation_duplicate_scanner_ids(self):
        """Test project validation with duplicate scanner IDs"""
        scanner2 = ScannerReference(
            scanner_id="test_scanner",  # Same ID as test_scanner
            scanner_file=self.test_scanner_file,
            parameter_file=self.test_param_file
        )

        with self.assertRaises(ValueError):
            ProjectConfig(
                project_id="test_project",
                name="Test Project",
                description="A test project",
                scanners=[self.test_scanner, scanner2]
            )

    def test_project_validation_nonexistent_scanner_file(self):
        """Test project validation with nonexistent scanner file"""
        invalid_scanner = ScannerReference(
            scanner_id="invalid_scanner",
            scanner_file="/nonexistent/path.py",
            parameter_file=self.test_param_file
        )

        with self.assertRaises(ValueError):
            ProjectConfig(
                project_id="test_project",
                name="Test Project",
                description="A test project",
                scanners=[invalid_scanner]
            )

    def test_add_scanner(self):
        """Test adding a scanner to project"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        # Create second scanner
        scanner2_file = os.path.join(self.temp_dir, "scanner2.py")
        with open(scanner2_file, 'w') as f:
            f.write("# Scanner 2\n")

        scanner2 = ScannerReference(
            scanner_id="scanner2",
            scanner_file=scanner2_file,
            parameter_file=self.test_param_file
        )

        initial_count = len(config.scanners)
        config.add_scanner(scanner2)

        self.assertEqual(len(config.scanners), initial_count + 1)
        self.assertEqual(config.scanners[-1].scanner_id, "scanner2")

    def test_add_duplicate_scanner(self):
        """Test adding a scanner with duplicate ID"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        duplicate_scanner = ScannerReference(
            scanner_id="test_scanner",
            scanner_file=self.test_scanner_file,
            parameter_file=self.test_param_file
        )

        with self.assertRaises(ValueError):
            config.add_scanner(duplicate_scanner)

    def test_remove_scanner(self):
        """Test removing a scanner from project"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        initial_count = len(config.scanners)
        removed = config.remove_scanner("test_scanner")

        self.assertTrue(removed)
        self.assertEqual(len(config.scanners), initial_count - 1)

    def test_remove_nonexistent_scanner(self):
        """Test removing a nonexistent scanner"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        removed = config.remove_scanner("nonexistent")
        self.assertFalse(removed)

    def test_get_scanner(self):
        """Test getting a scanner by ID"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        scanner = config.get_scanner("test_scanner")
        self.assertIsNotNone(scanner)
        self.assertEqual(scanner.scanner_id, "test_scanner")

        nonexistent = config.get_scanner("nonexistent")
        self.assertIsNone(nonexistent)

    def test_get_enabled_scanners(self):
        """Test getting only enabled scanners"""
        # Create disabled scanner
        disabled_scanner_file = os.path.join(self.temp_dir, "disabled.py")
        with open(disabled_scanner_file, 'w') as f:
            f.write("# Disabled scanner\n")

        disabled_scanner = ScannerReference(
            scanner_id="disabled",
            scanner_file=disabled_scanner_file,
            parameter_file=self.test_param_file,
            enabled=False
        )

        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner, disabled_scanner]
        )

        enabled = config.get_enabled_scanners()
        self.assertEqual(len(enabled), 1)
        self.assertEqual(enabled[0].scanner_id, "test_scanner")

    def test_update_scanner_order(self):
        """Test updating scanner execution order"""
        # Create multiple scanners
        scanner2_file = os.path.join(self.temp_dir, "scanner2.py")
        scanner3_file = os.path.join(self.temp_dir, "scanner3.py")

        for file_path in [scanner2_file, scanner3_file]:
            with open(file_path, 'w') as f:
                f.write("# Test scanner\n")

        scanner2 = ScannerReference(
            scanner_id="scanner2",
            scanner_file=scanner2_file,
            parameter_file=self.test_param_file
        )

        scanner3 = ScannerReference(
            scanner_id="scanner3",
            scanner_file=scanner3_file,
            parameter_file=self.test_param_file
        )

        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner, scanner2, scanner3]
        )

        # Update order
        new_order = ["scanner3", "test_scanner", "scanner2"]
        config.update_scanner_order(new_order)

        # Check order indices
        scanner_map = {s.scanner_id: s for s in config.scanners}
        self.assertEqual(scanner_map["scanner3"].order_index, 0)
        self.assertEqual(scanner_map["test_scanner"].order_index, 1)
        self.assertEqual(scanner_map["scanner2"].order_index, 2)

    def test_to_dict_serialization(self):
        """Test converting project config to dictionary"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner],
            aggregation_method=AggregationMethod.WEIGHTED,
            tags=["test", "demo"]
        )

        data = config.to_dict()

        self.assertEqual(data['project_id'], "test_project")
        self.assertEqual(data['name'], "Test Project")
        self.assertEqual(data['aggregation_method'], "weighted")
        self.assertEqual(data['tags'], ["test", "demo"])
        self.assertEqual(len(data['scanners']), 1)

    def test_from_dict_deserialization(self):
        """Test creating project config from dictionary"""
        data = {
            'project_id': 'test_project',
            'name': 'Test Project',
            'description': 'A test project',
            'aggregation_method': 'weighted',
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'version': 1,
            'tags': ['test'],
            'scanners': [{
                'scanner_id': 'test_scanner',
                'scanner_file': self.test_scanner_file,
                'parameter_file': self.test_param_file,
                'enabled': True,
                'weight': 1.0,
                'order_index': 0
            }]
        }

        config = ProjectConfig.from_dict(data)

        self.assertEqual(config.project_id, 'test_project')
        self.assertEqual(config.name, 'Test Project')
        self.assertEqual(config.aggregation_method, AggregationMethod.WEIGHTED)
        self.assertEqual(len(config.scanners), 1)

    def test_isolation_validation(self):
        """Test scanner isolation validation"""
        config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

        report = config.validate_isolation()

        self.assertIsInstance(report, dict)
        self.assertIn('isolation_maintained', report)
        self.assertIn('issues', report)
        self.assertIn('warnings', report)
        self.assertIn('scanner_count', report)


class TestProjectManager(unittest.TestCase):
    """Test ProjectManager functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_base_dir = tempfile.mkdtemp()
        self.manager = ProjectManager(self.temp_base_dir)

        # Create test scanner file
        self.test_scanner_file = os.path.join(self.temp_base_dir, "test_scanner.py")
        with open(self.test_scanner_file, 'w') as f:
            f.write("# Test scanner\nclass TestScanner:\n    pass\n")

        self.test_scanner = ScannerReference(
            scanner_id="test_scanner",
            scanner_file=self.test_scanner_file,
            parameter_file="/test/params.json"
        )

        self.test_config = ProjectConfig(
            project_id="test_project",
            name="Test Project",
            description="A test project",
            scanners=[self.test_scanner]
        )

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_base_dir, ignore_errors=True)

    def test_create_project(self):
        """Test creating a project"""
        config_path = self.manager.create_project(self.test_config)

        self.assertTrue(os.path.exists(config_path))

        # Verify project directory structure
        project_dir = self.manager.get_project_directory(self.test_config.project_id)
        self.assertTrue(project_dir.exists())
        self.assertTrue((project_dir / "parameters").exists())

    def test_load_project(self):
        """Test loading a project"""
        # First create a project
        self.manager.create_project(self.test_config)

        # Then load it
        loaded_config = self.manager.load_project(self.test_config.project_id)

        self.assertIsNotNone(loaded_config)
        self.assertEqual(loaded_config.project_id, self.test_config.project_id)
        self.assertEqual(loaded_config.name, self.test_config.name)

    def test_load_nonexistent_project(self):
        """Test loading a nonexistent project"""
        loaded_config = self.manager.load_project("nonexistent")
        self.assertIsNone(loaded_config)

    def test_update_project(self):
        """Test updating a project"""
        # Create project
        self.manager.create_project(self.test_config)

        # Update project
        self.test_config.name = "Updated Project"
        updated = self.manager.update_project(self.test_config)

        self.assertTrue(updated)

        # Verify update
        loaded_config = self.manager.load_project(self.test_config.project_id)
        self.assertEqual(loaded_config.name, "Updated Project")

    def test_update_nonexistent_project(self):
        """Test updating a nonexistent project"""
        updated = self.manager.update_project(self.test_config)
        self.assertFalse(updated)

    def test_delete_project(self):
        """Test deleting a project"""
        # Create project
        self.manager.create_project(self.test_config)

        # Verify it exists
        self.assertIsNotNone(self.manager.load_project(self.test_config.project_id))

        # Delete it
        deleted = self.manager.delete_project(self.test_config.project_id)
        self.assertTrue(deleted)

        # Verify it's gone
        self.assertIsNone(self.manager.load_project(self.test_config.project_id))

    def test_delete_nonexistent_project(self):
        """Test deleting a nonexistent project"""
        deleted = self.manager.delete_project("nonexistent")
        self.assertFalse(deleted)

    def test_list_projects(self):
        """Test listing projects"""
        # Initially empty
        projects = self.manager.list_projects()
        self.assertEqual(len(projects), 0)

        # Create a project
        self.manager.create_project(self.test_config)

        # Should now have one project
        projects = self.manager.list_projects()
        self.assertEqual(len(projects), 1)
        self.assertEqual(projects[0].project_id, self.test_config.project_id)


class TestExecutionConfig(unittest.TestCase):
    """Test ExecutionConfig functionality"""

    def test_execution_config_creation(self):
        """Test creating execution configuration"""
        config = ExecutionConfig(
            date_range={'start_date': '2024-01-01', 'end_date': '2024-01-31'},
            symbols=['AAPL', 'MSFT'],
            parallel_execution=True
        )

        self.assertEqual(config.date_range['start_date'], '2024-01-01')
        self.assertEqual(config.date_range['end_date'], '2024-01-31')
        self.assertEqual(len(config.symbols), 2)
        self.assertTrue(config.parallel_execution)
        self.assertEqual(config.timeout_seconds, 300)  # default

    def test_execution_config_defaults(self):
        """Test execution configuration defaults"""
        config = ExecutionConfig(
            date_range={'start_date': '2024-01-01', 'end_date': '2024-01-31'}
        )

        self.assertIsNone(config.symbols)
        self.assertIsNone(config.filters)
        self.assertTrue(config.parallel_execution)
        self.assertEqual(config.timeout_seconds, 300)


if __name__ == '__main__':
    unittest.main()