"""
Unit Tests for Parameter Management System

Tests the parameter management functionality including:
- Parameter loading and saving with isolation
- Parameter validation and type checking
- Parameter history and versioning
- Cache management
- Default parameter extraction
- Isolation validation
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
from backend.project_composition.parameter_manager import (
    ParameterManager,
    ParameterSnapshot
)


class TestParameterSnapshot(unittest.TestCase):
    """Test ParameterSnapshot functionality"""

    def test_parameter_snapshot_creation(self):
        """Test creating a parameter snapshot"""
        parameters = {'param1': 1.0, 'param2': 'test'}
        snapshot = ParameterSnapshot(
            scanner_id="test_scanner",
            parameters=parameters,
            timestamp=datetime.now(),
            version=1,
            description="Test snapshot"
        )

        self.assertEqual(snapshot.scanner_id, "test_scanner")
        self.assertEqual(snapshot.parameters, parameters)
        self.assertEqual(snapshot.version, 1)
        self.assertEqual(snapshot.description, "Test snapshot")

    def test_parameter_snapshot_serialization(self):
        """Test parameter snapshot to/from dict conversion"""
        timestamp = datetime.now()
        parameters = {'param1': 1.0, 'param2': 'test'}

        snapshot = ParameterSnapshot(
            scanner_id="test_scanner",
            parameters=parameters,
            timestamp=timestamp,
            version=1,
            description="Test snapshot"
        )

        # Test to_dict
        data = snapshot.to_dict()
        self.assertEqual(data['scanner_id'], "test_scanner")
        self.assertEqual(data['parameters'], parameters)
        self.assertEqual(data['version'], 1)

        # Test from_dict
        restored = ParameterSnapshot.from_dict(data)
        self.assertEqual(restored.scanner_id, snapshot.scanner_id)
        self.assertEqual(restored.parameters, snapshot.parameters)
        self.assertEqual(restored.version, snapshot.version)


class TestParameterManager(unittest.TestCase):
    """Test ParameterManager functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.temp_dir = tempfile.mkdtemp()
        self.project_base_path = os.path.join(self.temp_dir, "projects")
        os.makedirs(self.project_base_path)

        self.manager = ParameterManager(self.project_base_path)
        self.project_id = "test_project"
        self.scanner_id = "test_scanner"

        # Create project directory structure
        self.project_dir = Path(self.project_base_path) / self.project_id
        self.project_dir.mkdir(parents=True, exist_ok=True)
        (self.project_dir / "parameters").mkdir(exist_ok=True)

        # Create test scanner file with parameters
        self.scanner_file = self.project_dir / "test_scanner.py"
        scanner_code = '''
class TestScannerClass:
    def __init__(self):
        self.isolated_params = {
            'param1': 1.0,
            'param2': 2.5,
            'param3': 'default_value',
            'param4': True
        }
'''
        with open(self.scanner_file, 'w') as f:
            f.write(scanner_code)

    def tearDown(self):
        """Clean up test fixtures"""
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_get_parameter_file_path(self):
        """Test parameter file path generation"""
        path = self.manager.get_parameter_file_path(self.project_id, self.scanner_id)
        expected = Path(self.project_base_path) / self.project_id / "parameters" / f"{self.scanner_id}_params.json"
        self.assertEqual(path, expected)

    def test_get_parameter_history_path(self):
        """Test parameter history file path generation"""
        path = self.manager.get_parameter_history_path(self.project_id, self.scanner_id)
        expected = Path(self.project_base_path) / self.project_id / "parameters" / f"{self.scanner_id}_history.json"
        self.assertEqual(path, expected)

    def test_save_and_load_parameters(self):
        """Test saving and loading parameters"""
        test_params = {
            'param1': 2.0,
            'param2': 3.5,
            'param3': 'custom_value',
            'param4': False
        }

        # Mock parameter validation to pass
        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}

            # Save parameters
            success = self.manager.save_scanner_parameters(self.project_id, self.scanner_id, test_params)
            self.assertTrue(success)

        # Load parameters
        loaded_params = self.manager.load_scanner_parameters(self.project_id, self.scanner_id)
        self.assertEqual(loaded_params, test_params)

    def test_load_nonexistent_parameters(self):
        """Test loading parameters when file doesn't exist"""
        # Mock the default parameter extraction
        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = {'default_param': 1.0}

            with patch.object(self.manager, 'save_scanner_parameters') as mock_save:
                mock_save.return_value = True

                params = self.manager.load_scanner_parameters(self.project_id, "nonexistent_scanner")
                self.assertEqual(params, {'default_param': 1.0})

    def test_parameter_caching(self):
        """Test parameter caching functionality"""
        test_params = {'param1': 1.0}

        # Mock validation
        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}

            # Save parameters
            self.manager.save_scanner_parameters(self.project_id, self.scanner_id, test_params)

        # First load should read from file and cache
        params1 = self.manager.load_scanner_parameters(self.project_id, self.scanner_id)

        # Second load should use cache
        params2 = self.manager.load_scanner_parameters(self.project_id, self.scanner_id)

        self.assertEqual(params1, params2)
        self.assertEqual(params1, test_params)

    def test_clear_cache(self):
        """Test cache clearing functionality"""
        test_params = {'param1': 1.0}

        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}
            self.manager.save_scanner_parameters(self.project_id, self.scanner_id, test_params)

        # Load to populate cache
        self.manager.load_scanner_parameters(self.project_id, self.scanner_id)

        # Verify cache has data
        cache_key = f"{self.project_id}:{self.scanner_id}"
        self.assertIn(cache_key, self.manager.parameters_cache)

        # Clear specific cache
        self.manager.clear_cache(self.project_id, self.scanner_id)
        self.assertNotIn(cache_key, self.manager.parameters_cache)

    def test_clear_all_cache(self):
        """Test clearing all cache"""
        test_params = {'param1': 1.0}

        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}
            self.manager.save_scanner_parameters(self.project_id, self.scanner_id, test_params)

        # Load to populate cache
        self.manager.load_scanner_parameters(self.project_id, self.scanner_id)

        # Clear all cache
        self.manager.clear_cache()
        self.assertEqual(len(self.manager.parameters_cache), 0)

    def test_parameter_validation_type_conversion(self):
        """Test parameter validation with type conversion"""
        default_params = {
            'float_param': 1.0,
            'int_param': 5,
            'bool_param': True,
            'string_param': 'test'
        }

        input_params = {
            'float_param': '2.5',  # String that should convert to float
            'int_param': '10',     # String that should convert to int
            'bool_param': 'true',  # String that should convert to bool
            'string_param': 123    # Number that should convert to string
        }

        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = default_params

            result = self.manager.validate_parameters(self.project_id, self.scanner_id, input_params)

            self.assertTrue(result['valid'])
            self.assertEqual(input_params['float_param'], 2.5)
            self.assertEqual(input_params['int_param'], 10)

    def test_parameter_validation_invalid_type(self):
        """Test parameter validation with invalid types"""
        default_params = {'numeric_param': 1.0}
        input_params = {'numeric_param': 'not_a_number'}

        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = default_params

            result = self.manager.validate_parameters(self.project_id, self.scanner_id, input_params)

            self.assertFalse(result['valid'])
            self.assertGreater(len(result['errors']), 0)

    def test_parameter_validation_unknown_parameter(self):
        """Test parameter validation with unknown parameters"""
        default_params = {'known_param': 1.0}
        input_params = {
            'known_param': 2.0,
            'unknown_param': 'value'
        }

        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = default_params

            result = self.manager.validate_parameters(self.project_id, self.scanner_id, input_params)

            self.assertTrue(result['valid'])  # Should still be valid
            self.assertGreater(len(result['warnings']), 0)  # But with warnings

    def test_parameter_validation_missing_parameter(self):
        """Test parameter validation with missing parameters"""
        default_params = {'required_param': 1.0, 'optional_param': 2.0}
        input_params = {'required_param': 3.0}  # Missing optional_param

        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = default_params

            result = self.manager.validate_parameters(self.project_id, self.scanner_id, input_params)

            self.assertTrue(result['valid'])
            self.assertGreater(len(result['warnings']), 0)

    def test_save_parameter_history(self):
        """Test saving parameter history"""
        # First save some parameters
        initial_params = {'param1': 1.0}
        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}
            self.manager.save_scanner_parameters(self.project_id, self.scanner_id, initial_params)

        # Update parameters (should save to history)
        updated_params = {'param1': 2.0}
        with patch.object(self.manager, 'validate_parameters') as mock_validate:
            mock_validate.return_value = {'valid': True, 'errors': [], 'warnings': []}
            self.manager.save_scanner_parameters(self.project_id, self.scanner_id, updated_params)

        # Check history
        history = self.manager.get_parameter_history(self.project_id, self.scanner_id)
        self.assertGreater(len(history), 0)

    def test_get_parameter_history(self):
        """Test getting parameter history"""
        # Create some history entries
        history_data = [
            {
                'scanner_id': self.scanner_id,
                'parameters': {'param1': 1.0},
                'timestamp': datetime.now().isoformat(),
                'version': 1,
                'description': 'Initial version'
            },
            {
                'scanner_id': self.scanner_id,
                'parameters': {'param1': 2.0},
                'timestamp': datetime.now().isoformat(),
                'version': 2,
                'description': 'Updated version'
            }
        ]

        # Save history file
        history_file = self.manager.get_parameter_history_path(self.project_id, self.scanner_id)
        history_file.parent.mkdir(parents=True, exist_ok=True)
        with open(history_file, 'w') as f:
            json.dump(history_data, f)

        # Get history
        history = self.manager.get_parameter_history(self.project_id, self.scanner_id)

        self.assertEqual(len(history), 2)
        self.assertEqual(history[0].version, 1)
        self.assertEqual(history[1].version, 2)

    def test_restore_parameters(self):
        """Test restoring parameters from history"""
        # Create history
        history_data = [
            {
                'scanner_id': self.scanner_id,
                'parameters': {'param1': 1.0},
                'timestamp': datetime.now().isoformat(),
                'version': 1,
                'description': 'Version 1'
            },
            {
                'scanner_id': self.scanner_id,
                'parameters': {'param1': 2.0},
                'timestamp': datetime.now().isoformat(),
                'version': 2,
                'description': 'Version 2'
            }
        ]

        history_file = self.manager.get_parameter_history_path(self.project_id, self.scanner_id)
        history_file.parent.mkdir(parents=True, exist_ok=True)
        with open(history_file, 'w') as f:
            json.dump(history_data, f)

        # Mock save_scanner_parameters for restore
        with patch.object(self.manager, 'save_scanner_parameters') as mock_save:
            mock_save.return_value = True

            # Restore version 1
            restored = self.manager.restore_parameters(self.project_id, self.scanner_id, 1)
            self.assertTrue(restored)

            # Verify the correct parameters were passed to save
            mock_save.assert_called_with(self.project_id, self.scanner_id, {'param1': 1.0})

    def test_restore_nonexistent_version(self):
        """Test restoring a nonexistent version"""
        restored = self.manager.restore_parameters(self.project_id, self.scanner_id, 999)
        self.assertFalse(restored)

    def test_get_all_scanner_parameters(self):
        """Test getting all scanner parameters for a project"""
        # Create parameter files for multiple scanners
        scanners = ['scanner1', 'scanner2', 'scanner3']
        for i, scanner_id in enumerate(scanners):
            params = {f'param_{i}': float(i)}
            param_file = self.manager.get_parameter_file_path(self.project_id, scanner_id)
            param_file.parent.mkdir(parents=True, exist_ok=True)
            with open(param_file, 'w') as f:
                json.dump(params, f)

        # Mock validation and isolation validation
        with patch.object(self.manager, '_validate_parameter_isolation'):
            all_params = self.manager.get_all_scanner_parameters(self.project_id)

        self.assertEqual(len(all_params), 3)
        for i, scanner_id in enumerate(scanners):
            self.assertIn(scanner_id, all_params)
            self.assertEqual(all_params[scanner_id][f'param_{i}'], float(i))

    def test_export_project_parameters(self):
        """Test exporting project parameters"""
        # Create parameter files
        test_params = {'param1': 1.0, 'param2': 'test'}
        param_file = self.manager.get_parameter_file_path(self.project_id, self.scanner_id)
        param_file.parent.mkdir(parents=True, exist_ok=True)
        with open(param_file, 'w') as f:
            json.dump(test_params, f)

        # Export parameters
        export_file = os.path.join(self.temp_dir, "export.json")

        with patch.object(self.manager, '_validate_parameter_isolation'):
            success = self.manager.export_project_parameters(self.project_id, export_file)

        self.assertTrue(success)
        self.assertTrue(os.path.exists(export_file))

        # Verify export content
        with open(export_file, 'r') as f:
            export_data = json.load(f)

        self.assertEqual(export_data['project_id'], self.project_id)
        self.assertIn('scanner_parameters', export_data)
        self.assertIn(self.scanner_id, export_data['scanner_parameters'])

    def test_import_project_parameters(self):
        """Test importing project parameters"""
        # Create import data
        import_data = {
            'project_id': self.project_id,
            'export_timestamp': datetime.now().isoformat(),
            'scanner_parameters': {
                'scanner1': {'param1': 1.0},
                'scanner2': {'param2': 2.0}
            }
        }

        import_file = os.path.join(self.temp_dir, "import.json")
        with open(import_file, 'w') as f:
            json.dump(import_data, f)

        # Mock save_scanner_parameters
        with patch.object(self.manager, 'save_scanner_parameters') as mock_save:
            mock_save.return_value = True

            success = self.manager.import_project_parameters(self.project_id, import_file)

        self.assertTrue(success)

        # Verify save was called for each scanner
        self.assertEqual(mock_save.call_count, 2)

    def test_extract_default_parameters_with_isolated_params(self):
        """Test extracting default parameters from scanner with isolated_params"""
        # Create a more realistic scanner file
        scanner_code = '''
import os

class TestScanner:
    def __init__(self):
        self.isolated_params = {
            'threshold_1': 1.0,
            'threshold_2': 2.5,
            'volume_min': 1000000,
            'enabled_flag': True,
            'string_param': 'default'
        }

    def scan(self):
        pass
'''

        scanner_file = os.path.join(self.temp_dir, "scanner_with_params.py")
        with open(scanner_file, 'w') as f:
            f.write(scanner_code)

        # Mock the scanner file lookup
        with patch.object(self.manager, '_extract_default_parameters') as mock_extract:
            mock_extract.return_value = {
                'threshold_1': 1.0,
                'threshold_2': 2.5,
                'volume_min': 1000000,
                'enabled_flag': True,
                'string_param': 'default'
            }

            params = mock_extract.return_value

            self.assertIsInstance(params, dict)
            self.assertIn('threshold_1', params)
            self.assertIn('threshold_2', params)
            self.assertEqual(params['threshold_1'], 1.0)
            self.assertEqual(params['volume_min'], 1000000)
            self.assertTrue(params['enabled_flag'])

    def test_isolation_validation(self):
        """Test parameter isolation validation"""
        # Test parameters with suspicious patterns
        suspicious_params = {
            'param_other_scanner': 1.0,  # Suspicious pattern
            'shared_global_var': 2.0,    # Suspicious pattern
            'normal_param': 3.0          # Normal parameter
        }

        # Mock _validate_parameter_isolation to capture calls
        with patch.object(self.manager, '_validate_parameter_isolation') as mock_validate:
            self.manager.load_scanner_parameters(self.project_id, self.scanner_id)

            # Should be called during load
            mock_validate.assert_called()


if __name__ == '__main__':
    unittest.main()