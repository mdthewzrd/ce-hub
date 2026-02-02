"""
Parameter Management System for edge.dev Project Composition Engine

This module handles scanner-specific parameters while maintaining complete isolation
and zero contamination between scanners. It integrates with the proven AI Scanner
Isolation System to ensure parameter integrity.

Core Principles:
- Parameter Isolation: Each scanner has its own isolated parameter space
- Zero Contamination: No parameter mixing between scanners
- Dynamic Loading: Parameters loaded per execution without global state
- Validation: Type checking and compatibility validation
- Versioning: Parameter history and rollback capabilities
"""

import json
import os
import importlib.util
import inspect
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import logging
from dataclasses import dataclass
import shutil


logger = logging.getLogger(__name__)


@dataclass
class ParameterSnapshot:
    """Snapshot of scanner parameters at a point in time"""
    scanner_id: str
    parameters: Dict[str, Any]
    timestamp: datetime
    version: int
    description: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            'scanner_id': self.scanner_id,
            'parameters': self.parameters,
            'timestamp': self.timestamp.isoformat(),
            'version': self.version,
            'description': self.description
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ParameterSnapshot':
        return cls(
            scanner_id=data['scanner_id'],
            parameters=data['parameters'],
            timestamp=datetime.fromisoformat(data['timestamp']),
            version=data['version'],
            description=data.get('description', '')
        )


class ParameterManager:
    """
    Manages scanner-specific parameters with complete isolation

    This class ensures that each scanner in a project maintains its own
    parameter space without any cross-contamination, building on the
    proven AI Scanner Isolation System.
    """

    def __init__(self, project_base_path: str):
        self.project_base_path = Path(project_base_path)
        self.parameters_cache = {}  # In-memory cache for active parameters
        self.isolation_validation = True  # Enable strict isolation checking

    def get_parameter_file_path(self, project_id: str, scanner_id: str) -> Path:
        """Get the path to a scanner's parameter file"""
        return self.project_base_path / project_id / "parameters" / f"{scanner_id}_params.json"

    def get_parameter_history_path(self, project_id: str, scanner_id: str) -> Path:
        """Get the path to a scanner's parameter history"""
        return self.project_base_path / project_id / "parameters" / f"{scanner_id}_history.json"

    def load_scanner_parameters(self, project_id: str, scanner_id: str) -> Dict[str, Any]:
        """
        Load parameters for a specific scanner with complete isolation

        Returns:
            Dict containing scanner-specific parameters
        """
        cache_key = f"{project_id}:{scanner_id}"

        # Check cache first (but always validate freshness)
        if cache_key in self.parameters_cache:
            cached_params, cached_time = self.parameters_cache[cache_key]
            param_file = self.get_parameter_file_path(project_id, scanner_id)

            # Use cached version if file hasn't changed
            if param_file.exists() and param_file.stat().st_mtime <= cached_time:
                logger.debug(f"Using cached parameters for {scanner_id}")
                return cached_params.copy()  # Return copy to prevent mutations

        # Load from file
        param_file = self.get_parameter_file_path(project_id, scanner_id)
        parameters = {}

        if param_file.exists():
            try:
                with open(param_file, 'r') as f:
                    parameters = json.load(f)
                logger.info(f"Loaded parameters for scanner {scanner_id} from {param_file}")
            except (json.JSONDecodeError, IOError) as e:
                logger.error(f"Failed to load parameters for {scanner_id}: {e}")
                parameters = {}
        else:
            # Try to extract default parameters from scanner file
            parameters = self._extract_default_parameters(project_id, scanner_id)
            if parameters:
                # Save extracted parameters for future use
                self.save_scanner_parameters(project_id, scanner_id, parameters)

        # Cache the parameters with timestamp
        self.parameters_cache[cache_key] = (parameters.copy(), datetime.now().timestamp())

        # Validate isolation
        if self.isolation_validation:
            self._validate_parameter_isolation(project_id, scanner_id, parameters)

        return parameters.copy()  # Return copy to prevent external mutations

    def save_scanner_parameters(self, project_id: str, scanner_id: str, parameters: Dict[str, Any]) -> bool:
        """
        Save parameters for a specific scanner with validation

        Args:
            project_id: Project identifier
            scanner_id: Scanner identifier
            parameters: Parameter dictionary to save

        Returns:
            True if saved successfully, False otherwise
        """
        try:
            # Validate parameters before saving
            validation_result = self.validate_parameters(project_id, scanner_id, parameters)
            if not validation_result['valid']:
                logger.error(f"Parameter validation failed for {scanner_id}: {validation_result['errors']}")
                return False

            # Create parameter directory if needed
            param_file = self.get_parameter_file_path(project_id, scanner_id)
            param_file.parent.mkdir(parents=True, exist_ok=True)

            # Save current parameters to history before overwriting
            if param_file.exists():
                self._save_to_history(project_id, scanner_id)

            # Save new parameters
            with open(param_file, 'w') as f:
                json.dump(parameters, f, indent=2)

            # Update cache
            cache_key = f"{project_id}:{scanner_id}"
            self.parameters_cache[cache_key] = (parameters.copy(), datetime.now().timestamp())

            logger.info(f"Saved parameters for scanner {scanner_id}")
            return True

        except Exception as e:
            logger.error(f"Failed to save parameters for {scanner_id}: {e}")
            return False

    def validate_parameters(self, project_id: str, scanner_id: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate parameters against scanner schema and type requirements

        Returns:
            Validation result with 'valid' boolean and any 'errors'
        """
        result = {'valid': True, 'errors': [], 'warnings': []}

        try:
            # Load scanner default parameters to get expected schema
            default_params = self._extract_default_parameters(project_id, scanner_id)

            # Type validation
            for key, value in parameters.items():
                if key in default_params:
                    expected_type = type(default_params[key])
                    if not isinstance(value, expected_type):
                        try:
                            # Attempt type conversion
                            if expected_type == float:
                                parameters[key] = float(value)
                            elif expected_type == int:
                                parameters[key] = int(value)
                            elif expected_type == bool:
                                parameters[key] = bool(value)
                            elif expected_type == str:
                                parameters[key] = str(value)
                        except (ValueError, TypeError):
                            result['errors'].append(f"Invalid type for {key}: expected {expected_type.__name__}, got {type(value).__name__}")
                            result['valid'] = False
                else:
                    result['warnings'].append(f"Unknown parameter: {key}")

            # Check for required parameters
            for key in default_params:
                if key not in parameters:
                    result['warnings'].append(f"Missing parameter: {key}, using default value")

        except Exception as e:
            logger.error(f"Parameter validation error for {scanner_id}: {e}")
            result['errors'].append(f"Validation error: {e}")
            result['valid'] = False

        return result

    def get_parameter_history(self, project_id: str, scanner_id: str) -> List[ParameterSnapshot]:
        """Get the parameter history for a scanner"""
        history_file = self.get_parameter_history_path(project_id, scanner_id)

        if not history_file.exists():
            return []

        try:
            with open(history_file, 'r') as f:
                history_data = json.load(f)
            return [ParameterSnapshot.from_dict(item) for item in history_data]
        except Exception as e:
            logger.error(f"Failed to load parameter history for {scanner_id}: {e}")
            return []

    def restore_parameters(self, project_id: str, scanner_id: str, version: int) -> bool:
        """Restore parameters to a specific version from history"""
        history = self.get_parameter_history(project_id, scanner_id)
        target_snapshot = next((s for s in history if s.version == version), None)

        if target_snapshot is None:
            logger.error(f"Version {version} not found in history for {scanner_id}")
            return False

        return self.save_scanner_parameters(project_id, scanner_id, target_snapshot.parameters)

    def clear_cache(self, project_id: Optional[str] = None, scanner_id: Optional[str] = None) -> None:
        """Clear parameter cache for specific project/scanner or all"""
        if project_id and scanner_id:
            cache_key = f"{project_id}:{scanner_id}"
            self.parameters_cache.pop(cache_key, None)
        elif project_id:
            keys_to_remove = [k for k in self.parameters_cache.keys() if k.startswith(f"{project_id}:")]
            for key in keys_to_remove:
                self.parameters_cache.pop(key, None)
        else:
            self.parameters_cache.clear()

    def _extract_default_parameters(self, project_id: str, scanner_id: str) -> Dict[str, Any]:
        """
        Extract default parameters from scanner file using AST analysis

        This integrates with the existing AI Scanner Isolation System to
        extract the isolated parameter set from the scanner file.
        """
        try:
            # Look for scanner file in project or global scanner directory
            scanner_files = [
                Path("/Users/michaeldurante/ai dev/ce-hub/edge-dev/generated_scanners") / f"{scanner_id}.py",
                self.project_base_path / project_id / "scanners" / f"{scanner_id}.py"
            ]

            scanner_file = None
            for file_path in scanner_files:
                if file_path.exists():
                    scanner_file = file_path
                    break

            if not scanner_file:
                logger.warning(f"Scanner file not found for {scanner_id}")
                return {}

            # Load the scanner module to extract parameters
            spec = importlib.util.spec_from_file_location(scanner_id, scanner_file)
            if spec is None or spec.loader is None:
                logger.error(f"Failed to load scanner spec for {scanner_file}")
                return {}

            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            # Look for scanner class and extract isolated_params
            scanner_classes = [obj for name, obj in inspect.getmembers(module, inspect.isclass)
                             if name.endswith('Scanner')]

            if not scanner_classes:
                logger.warning(f"No scanner class found in {scanner_file}")
                return {}

            scanner_class = scanner_classes[0]
            instance = scanner_class()

            # Extract isolated parameters
            if hasattr(instance, 'isolated_params'):
                return instance.isolated_params.copy()
            elif hasattr(instance, 'parameters'):
                return instance.parameters.copy()
            else:
                logger.warning(f"No parameters found in scanner {scanner_id}")
                return {}

        except Exception as e:
            logger.error(f"Failed to extract parameters from {scanner_id}: {e}")
            return {}

    def _save_to_history(self, project_id: str, scanner_id: str) -> None:
        """Save current parameters to history before overwriting"""
        try:
            current_params = self.load_scanner_parameters(project_id, scanner_id)
            history_file = self.get_parameter_history_path(project_id, scanner_id)

            # Load existing history
            history = []
            if history_file.exists():
                try:
                    with open(history_file, 'r') as f:
                        history_data = json.load(f)
                    history = [ParameterSnapshot.from_dict(item) for item in history_data]
                except Exception:
                    pass  # Start fresh if history is corrupted

            # Create new snapshot
            next_version = max([h.version for h in history], default=0) + 1
            snapshot = ParameterSnapshot(
                scanner_id=scanner_id,
                parameters=current_params,
                timestamp=datetime.now(),
                version=next_version,
                description=f"Auto-saved before update"
            )

            history.append(snapshot)

            # Keep only last 10 versions
            history = sorted(history, key=lambda x: x.version)[-10:]

            # Save updated history
            history_file.parent.mkdir(parents=True, exist_ok=True)
            with open(history_file, 'w') as f:
                json.dump([h.to_dict() for h in history], f, indent=2)

        except Exception as e:
            logger.error(f"Failed to save parameter history for {scanner_id}: {e}")

    def _validate_parameter_isolation(self, project_id: str, scanner_id: str, parameters: Dict[str, Any]) -> None:
        """
        Validate that parameters maintain proper isolation

        This checks that the parameters loaded for one scanner don't contain
        references or contamination from other scanners.
        """
        # Check for suspicious parameter names that might indicate contamination
        suspicious_patterns = ['_other_', '_shared_', '_global_']

        for param_name in parameters.keys():
            for pattern in suspicious_patterns:
                if pattern in param_name.lower():
                    logger.warning(f"Potentially shared parameter detected: {param_name} in {scanner_id}")

        # Validate that parameter names match scanner naming conventions
        expected_prefix = scanner_id.replace('_', '_').lower()
        for param_name in parameters.keys():
            if not param_name.startswith(('threshold_', 'column_', 'd2_', 'd3_', expected_prefix)):
                logger.debug(f"Parameter name doesn't follow expected convention: {param_name}")

    def get_all_scanner_parameters(self, project_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Get parameters for all scanners in a project

        Returns a dictionary mapping scanner_id to its parameters.
        Each scanner's parameters are completely isolated.
        """
        project_dir = self.project_base_path / project_id
        param_dir = project_dir / "parameters"

        all_parameters = {}

        if not param_dir.exists():
            return all_parameters

        # Find all parameter files
        for param_file in param_dir.glob("*_params.json"):
            scanner_id = param_file.stem.replace("_params", "")
            try:
                parameters = self.load_scanner_parameters(project_id, scanner_id)
                all_parameters[scanner_id] = parameters
            except Exception as e:
                logger.error(f"Failed to load parameters for {scanner_id}: {e}")

        return all_parameters

    def export_project_parameters(self, project_id: str, export_path: str) -> bool:
        """Export all project parameters to a file for backup"""
        try:
            all_params = self.get_all_scanner_parameters(project_id)

            export_data = {
                'project_id': project_id,
                'export_timestamp': datetime.now().isoformat(),
                'scanner_parameters': all_params
            }

            with open(export_path, 'w') as f:
                json.dump(export_data, f, indent=2)

            logger.info(f"Exported parameters for project {project_id} to {export_path}")
            return True

        except Exception as e:
            logger.error(f"Failed to export parameters for project {project_id}: {e}")
            return False

    def import_project_parameters(self, project_id: str, import_path: str) -> bool:
        """Import parameters from an exported file"""
        try:
            with open(import_path, 'r') as f:
                import_data = json.load(f)

            scanner_parameters = import_data.get('scanner_parameters', {})

            success_count = 0
            for scanner_id, parameters in scanner_parameters.items():
                if self.save_scanner_parameters(project_id, scanner_id, parameters):
                    success_count += 1

            logger.info(f"Imported parameters for {success_count}/{len(scanner_parameters)} scanners")
            return success_count == len(scanner_parameters)

        except Exception as e:
            logger.error(f"Failed to import parameters for project {project_id}: {e}")
            return False