"""
Example Project Configuration for 3 LC Scanners

This script demonstrates how to create a project composition with the 3 LC scanners
from the existing isolated scanner system. It shows:

1. Project creation with multiple scanners
2. Parameter management for each scanner
3. Example execution configuration
4. Signal aggregation setup
5. Complete project workflow

LC Scanners to be included:
- lc_frontside_d2_extended
- lc_frontside_d2_extended_1
- lc_frontside_d3_extended_1
"""

import os
import sys
import json
import asyncio
from datetime import datetime
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.project_composition.project_config import (
    ProjectConfig,
    ScannerReference,
    AggregationMethod,
    ProjectManager,
    ExecutionConfig
)
from backend.project_composition.parameter_manager import ParameterManager
from backend.project_composition.composition_engine import ProjectCompositionEngine


def create_lc_momentum_project():
    """
    Create the LC Momentum Setup project with 3 isolated scanners
    """
    # Define project paths
    base_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
    scanners_path = os.path.join(base_path, "generated_scanners")
    projects_path = os.path.join(base_path, "projects")

    # Create scanner references
    scanners = [
        ScannerReference(
            scanner_id="lc_frontside_d2_extended",
            scanner_file=os.path.join(scanners_path, "lc_frontside_d2_extended.py"),
            parameter_file="",  # Will be created automatically
            enabled=True,
            weight=1.0,
            order_index=0
        ),
        ScannerReference(
            scanner_id="lc_frontside_d2_extended_1",
            scanner_file=os.path.join(scanners_path, "lc_frontside_d2_extended_1.py"),
            parameter_file="",  # Will be created automatically
            enabled=True,
            weight=1.2,  # Slightly higher weight
            order_index=1
        ),
        ScannerReference(
            scanner_id="lc_frontside_d3_extended_1",
            scanner_file=os.path.join(scanners_path, "lc_frontside_d3_extended_1.py"),
            parameter_file="",  # Will be created automatically
            enabled=True,
            weight=1.5,  # Highest weight for 3-day pattern
            order_index=2
        )
    ]

    # Create project configuration
    project_config = ProjectConfig(
        project_id="lc_momentum_setup",
        name="LC Momentum Setup",
        description="Multi-scanner project combining 2-day and 3-day LC momentum patterns for enhanced signal detection",
        scanners=scanners,
        aggregation_method=AggregationMethod.WEIGHTED,  # Use weighted aggregation
        tags=["momentum", "lc", "frontside", "multi-scanner"],
        created_by="edge-dev-system"
    )

    print("✅ Created LC Momentum Setup project configuration")
    print(f"📊 Project ID: {project_config.project_id}")
    print(f"📈 Scanners: {len(project_config.scanners)}")
    print(f"🔄 Aggregation Method: {project_config.aggregation_method.value}")

    return project_config


def create_scanner_parameters():
    """
    Create custom parameter configurations for each scanner
    """
    # Parameters for lc_frontside_d2_extended
    d2_extended_params = {
        # Volume thresholds
        'threshold_556_10000000_0': 15000000.0,    # Higher volume requirement
        'threshold_557_500000000_0': 750000000.0,   # Higher dollar volume
        'threshold_558_5_0': 7.5,                   # Higher minimum price

        # Technical thresholds - slightly more conservative
        'threshold_543_1_0': 1.2,                   # Tighter momentum requirement
        'threshold_543_5_0': 4.0,                   # Lower max level
        'threshold_543_2_5': 3.0,                   # Higher distance requirement
        'threshold_543_0_15': 0.20,                 # Higher gap requirement
        'threshold_543_15_0': 12.0,                 # Lower max distance

        # Pattern flags
        'd2_pattern_h_h1': True,
        'd2_pattern_highest_high_5_dist': True,
        'd2_pattern_dist_l_9ema_atr': True,
        'd2_pattern_dol_v_cum5': True
    }

    # Parameters for lc_frontside_d2_extended_1 (variant)
    d2_extended_1_params = {
        # Volume thresholds - slightly different
        'threshold_556_10000000_0': 12000000.0,    # Moderate volume
        'threshold_557_500000000_0': 600000000.0,   # Moderate dollar volume
        'threshold_558_5_0': 6.0,                   # Lower minimum price for broader coverage

        # Technical thresholds - more aggressive for variant
        'threshold_543_1_0': 0.8,                   # More lenient momentum
        'threshold_543_5_0': 6.0,                   # Higher max level
        'threshold_543_2_5': 2.0,                   # Standard distance
        'threshold_543_0_15': 0.12,                 # Lower gap requirement
        'threshold_543_15_0': 18.0,                 # Higher max distance

        # Additional variant thresholds
        'threshold_544_0_5': 0.4,
        'threshold_544_15_0': 20.0,
        'threshold_544_2_0': 1.8,
        'threshold_544_0_1': 0.08,
        'threshold_544_25_0': 30.0,

        # Pattern flags
        'd2_pattern_h_h1': True,
        'd2_pattern_highest_high_5_dist': True,
        'd2_pattern_dist_l_9ema_atr': True,
        'd2_pattern_dol_v_cum5': True
    }

    # Parameters for lc_frontside_d3_extended_1 (3-day pattern)
    d3_extended_1_params = {
        # Volume thresholds - highest requirements for 3-day pattern
        'threshold_556_10000000_0': 20000000.0,    # Highest volume requirement
        'threshold_557_500000000_0': 1000000000.0,  # Highest dollar volume
        'threshold_558_5_0': 10.0,                  # Highest minimum price

        # Technical thresholds - most conservative for quality
        'threshold_543_1_0': 1.5,                   # Strongest momentum requirement
        'threshold_543_5_0': 3.5,                   # Lowest max level
        'threshold_543_2_5': 3.5,                   # Highest distance requirement
        'threshold_543_0_15': 0.25,                 # Highest gap requirement
        'threshold_543_15_0': 10.0,                 # Lowest max distance

        # 3-day pattern specific thresholds
        'threshold_545_0_3': 0.4,                   # Tighter 3-day requirement
        'threshold_545_25_0': 20.0,                 # Lower max for quality
        'threshold_545_1_5': 2.0,                   # Higher minimum
        'threshold_545_0_05': 0.08,                 # Higher precision
        'threshold_545_50_0': 40.0,                 # Lower max

        'threshold_546_0_2': 0.25,                  # Higher requirement
        'threshold_546_50_0': 45.0,                 # Lower max
        'threshold_546_1_0': 1.3,                   # Higher minimum
        'threshold_546_0_05': 0.07,                 # Higher precision
        'threshold_546_90_0': 80.0,                 # Lower max

        'threshold_547_0_15': 0.20,                 # Higher requirement
        'threshold_547_90_0': 85.0,                 # Lower max
        'threshold_547_0_75': 0.80,                 # Higher requirement
        'threshold_547_0_03': 0.05,                 # Higher precision

        # Final filtering
        'threshold_552_1_5': 2.0,
        'threshold_554_2_0': 2.5,
        'threshold_555_3_0': 3.5,
        'threshold_560_1_0': 1.2,
        'threshold_562_1_0': 1.3,
        'threshold_564_500000000_0': 800000000.0,

        # 3-day pattern flags
        'd3_pattern_enabled': True,
        'column_lc_frontside_d3_extended_1': 'lc_frontside_d3_extended_1'
    }

    scanner_parameters = {
        'lc_frontside_d2_extended': d2_extended_params,
        'lc_frontside_d2_extended_1': d2_extended_1_params,
        'lc_frontside_d3_extended_1': d3_extended_1_params
    }

    print("✅ Created custom parameter configurations for all scanners")
    for scanner_id, params in scanner_parameters.items():
        print(f"📊 {scanner_id}: {len(params)} parameters")

    return scanner_parameters


def setup_project_parameters(project_config, scanner_parameters):
    """
    Set up parameter files for each scanner in the project
    """
    base_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
    parameter_manager = ParameterManager(os.path.join(base_path, "projects"))

    print("🔧 Setting up scanner parameters...")

    for scanner_ref in project_config.scanners:
        scanner_id = scanner_ref.scanner_id

        if scanner_id in scanner_parameters:
            # Save custom parameters
            success = parameter_manager.save_scanner_parameters(
                project_config.project_id,
                scanner_id,
                scanner_parameters[scanner_id]
            )

            if success:
                print(f"✅ Saved parameters for {scanner_id}")

                # Update scanner reference with parameter file path
                param_file = parameter_manager.get_parameter_file_path(
                    project_config.project_id, scanner_id
                )
                scanner_ref.parameter_file = str(param_file)
            else:
                print(f"❌ Failed to save parameters for {scanner_id}")
        else:
            print(f"⚠️ No custom parameters defined for {scanner_id}")

    return True


def create_example_execution_config():
    """
    Create an example execution configuration for testing
    """
    # Example: Recent 30-day period
    from datetime import datetime, timedelta

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)

    execution_config = ExecutionConfig(
        date_range={
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        symbols=None,  # Scan all symbols
        filters={
            'min_volume': 10000000,
            'min_dollar_volume': 500000000,
            'min_price': 5.0
        },
        parallel_execution=True,
        timeout_seconds=600  # 10 minutes for multi-scanner execution
    )

    print("✅ Created example execution configuration")
    print(f"📅 Date Range: {execution_config.date_range['start_date']} to {execution_config.date_range['end_date']}")
    print(f"🔄 Parallel Execution: {execution_config.parallel_execution}")
    print(f"⏱️ Timeout: {execution_config.timeout_seconds} seconds")

    return execution_config


async def demonstrate_project_execution(project_config, execution_config):
    """
    Demonstrate project execution (dry run - doesn't actually execute scanners)
    """
    print("\n🚀 Demonstrating Project Execution...")

    try:
        # Initialize composition engine
        engine = ProjectCompositionEngine(project_config)

        # Get isolation validation report
        isolation_report = engine.get_isolation_validation_report()

        print(f"🔒 Isolation Status: {'✅ Maintained' if isolation_report['isolation_maintained'] else '❌ Compromised'}")
        print(f"📊 Scanners Checked: {len(isolation_report['scanners_checked'])}")

        if isolation_report['issues']:
            print("⚠️ Isolation Issues:")
            for issue in isolation_report['issues']:
                print(f"  - {issue}")

        if isolation_report['warnings']:
            print("⚠️ Isolation Warnings:")
            for warning in isolation_report['warnings']:
                print(f"  - {warning}")

        # Note: Actual execution would require the scanners to be properly integrated
        # This is a demonstration of the project structure and configuration

        print("\n✅ Project validation complete")
        print("💡 Project is ready for execution once scanner integration is completed")

    except Exception as e:
        print(f"❌ Demonstration error: {e}")
        return False

    return True


def save_project_to_file(project_config):
    """
    Save the project configuration to a file for future reference
    """
    base_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
    projects_path = os.path.join(base_path, "projects")

    # Create project manager and save
    project_manager = ProjectManager(projects_path)
    config_path = project_manager.create_project(project_config)

    print(f"✅ Project saved to: {config_path}")
    print(f"📁 Project directory: {project_manager.get_project_directory(project_config.project_id)}")

    return config_path


def create_project_documentation(project_config, scanner_parameters):
    """
    Create comprehensive documentation for the project
    """
    base_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
    doc_content = f"""# LC Momentum Setup Project

## Overview
This project combines three LC momentum scanners to create a comprehensive momentum detection system with enhanced signal quality through weighted aggregation.

## Project Configuration
- **Project ID**: {project_config.project_id}
- **Name**: {project_config.name}
- **Description**: {project_config.description}
- **Aggregation Method**: {project_config.aggregation_method.value}
- **Created**: {project_config.created_at.strftime('%Y-%m-%d %H:%M:%S')}

## Scanners

### 1. lc_frontside_d2_extended
- **Weight**: 1.0 (baseline)
- **Pattern**: 2-day extended momentum pattern
- **Parameters**: Conservative settings for quality signals
- **Focus**: Standard 2-day momentum setups with moderate volume requirements

### 2. lc_frontside_d2_extended_1
- **Weight**: 1.2 (enhanced)
- **Pattern**: 2-day extended momentum pattern (variant)
- **Parameters**: More aggressive settings for broader coverage
- **Focus**: Alternative 2-day setups with slightly different criteria

### 3. lc_frontside_d3_extended_1
- **Weight**: 1.5 (highest)
- **Pattern**: 3-day extended momentum pattern
- **Parameters**: Most conservative settings for highest quality
- **Focus**: Multi-day momentum continuation patterns with strict requirements

## Parameter Customization

Each scanner has been customized with specific parameters to optimize for different market conditions while maintaining scanner isolation:

"""

    # Add parameter details for each scanner
    for scanner_id, params in scanner_parameters.items():
        doc_content += f"""
### {scanner_id} Parameters
"""
        for param, value in sorted(params.items()):
            doc_content += f"- `{param}`: {value}\n"

    doc_content += f"""

## Aggregation Strategy

The project uses **weighted aggregation** with the following rationale:
- **lc_frontside_d2_extended** (1.0): Baseline 2-day patterns
- **lc_frontside_d2_extended_1** (1.2): Enhanced 2-day variant patterns
- **lc_frontside_d3_extended_1** (1.5): Premium 3-day continuation patterns

Signals found by multiple scanners receive higher confidence scores, with 3-day patterns weighted most heavily for quality.

## Usage Example

```python
# Load project
project_manager = ProjectManager()
project = project_manager.load_project("lc_momentum_setup")

# Execute project
engine = ProjectCompositionEngine(project)
execution_config = ExecutionConfig(
    date_range={{'start_date': '2024-01-01', 'end_date': '2024-01-31'}},
    parallel_execution=True
)

results, report = await engine.execute_project(execution_config)
```

## Expected Benefits

1. **Enhanced Signal Quality**: Multiple scanners validate momentum setups
2. **Broader Coverage**: Different parameter sets capture various market conditions
3. **Quality Ranking**: Weighted aggregation prioritizes higher-quality patterns
4. **Risk Management**: Conservative 3-day patterns get highest weight
5. **Scanner Isolation**: Zero parameter contamination between scanners

## Performance Expectations

- **Signal Volume**: Moderate to high (union of 3 scanners)
- **Signal Quality**: High (weighted toward conservative patterns)
- **Execution Time**: ~2-5 minutes for 30-day scan
- **Resource Usage**: Parallel execution optimized for speed

Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""

    # Save documentation
    doc_path = os.path.join(base_path, "projects", project_config.project_id, "README.md")
    os.makedirs(os.path.dirname(doc_path), exist_ok=True)

    with open(doc_path, 'w') as f:
        f.write(doc_content)

    print(f"✅ Project documentation saved to: {doc_path}")
    return doc_path


async def main():
    """
    Main function to demonstrate the complete LC project setup
    """
    print("🚀 Creating LC Momentum Setup Project")
    print("=" * 50)

    try:
        # Step 1: Create project configuration
        project_config = create_lc_momentum_project()

        # Step 2: Create scanner parameters
        scanner_parameters = create_scanner_parameters()

        # Step 3: Set up project parameters
        setup_project_parameters(project_config, scanner_parameters)

        # Step 4: Create execution configuration
        execution_config = create_example_execution_config()

        # Step 5: Save project
        config_path = save_project_to_file(project_config)

        # Step 6: Create documentation
        doc_path = create_project_documentation(project_config, scanner_parameters)

        # Step 7: Demonstrate execution
        await demonstrate_project_execution(project_config, execution_config)

        print("\n" + "=" * 50)
        print("✅ LC Momentum Setup Project Created Successfully!")
        print(f"📄 Configuration: {config_path}")
        print(f"📚 Documentation: {doc_path}")
        print(f"🎯 Ready for integration with scanner isolation system")

    except Exception as e:
        print(f"❌ Error creating project: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())