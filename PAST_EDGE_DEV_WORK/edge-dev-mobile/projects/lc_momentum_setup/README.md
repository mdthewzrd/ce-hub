# LC Momentum Setup Project

## Overview
This project combines three LC momentum scanners to create a comprehensive momentum detection system with enhanced signal quality through weighted aggregation.

## Project Configuration
- **Project ID**: lc_momentum_setup
- **Name**: LC Momentum Setup
- **Description**: Multi-scanner project combining 2-day and 3-day LC momentum patterns for enhanced signal detection
- **Aggregation Method**: weighted
- **Created**: 2025-11-11 11:01:19

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


### lc_frontside_d2_extended Parameters
- `d2_pattern_dist_l_9ema_atr`: True
- `d2_pattern_dol_v_cum5`: True
- `d2_pattern_h_h1`: True
- `d2_pattern_highest_high_5_dist`: True
- `threshold_543_0_15`: 0.2
- `threshold_543_15_0`: 12.0
- `threshold_543_1_0`: 1.2
- `threshold_543_2_5`: 3.0
- `threshold_543_5_0`: 4.0
- `threshold_556_10000000_0`: 15000000.0
- `threshold_557_500000000_0`: 750000000.0
- `threshold_558_5_0`: 7.5

### lc_frontside_d2_extended_1 Parameters
- `d2_pattern_dist_l_9ema_atr`: True
- `d2_pattern_dol_v_cum5`: True
- `d2_pattern_h_h1`: True
- `d2_pattern_highest_high_5_dist`: True
- `threshold_543_0_15`: 0.12
- `threshold_543_15_0`: 18.0
- `threshold_543_1_0`: 0.8
- `threshold_543_2_5`: 2.0
- `threshold_543_5_0`: 6.0
- `threshold_544_0_1`: 0.08
- `threshold_544_0_5`: 0.4
- `threshold_544_15_0`: 20.0
- `threshold_544_25_0`: 30.0
- `threshold_544_2_0`: 1.8
- `threshold_556_10000000_0`: 12000000.0
- `threshold_557_500000000_0`: 600000000.0
- `threshold_558_5_0`: 6.0

### lc_frontside_d3_extended_1 Parameters
- `column_lc_frontside_d3_extended_1`: lc_frontside_d3_extended_1
- `d3_pattern_enabled`: True
- `threshold_543_0_15`: 0.25
- `threshold_543_15_0`: 10.0
- `threshold_543_1_0`: 1.5
- `threshold_543_2_5`: 3.5
- `threshold_543_5_0`: 3.5
- `threshold_545_0_05`: 0.08
- `threshold_545_0_3`: 0.4
- `threshold_545_1_5`: 2.0
- `threshold_545_25_0`: 20.0
- `threshold_545_50_0`: 40.0
- `threshold_546_0_05`: 0.07
- `threshold_546_0_2`: 0.25
- `threshold_546_1_0`: 1.3
- `threshold_546_50_0`: 45.0
- `threshold_546_90_0`: 80.0
- `threshold_547_0_03`: 0.05
- `threshold_547_0_15`: 0.2
- `threshold_547_0_75`: 0.8
- `threshold_547_90_0`: 85.0
- `threshold_552_1_5`: 2.0
- `threshold_554_2_0`: 2.5
- `threshold_555_3_0`: 3.5
- `threshold_556_10000000_0`: 20000000.0
- `threshold_557_500000000_0`: 1000000000.0
- `threshold_558_5_0`: 10.0
- `threshold_560_1_0`: 1.2
- `threshold_562_1_0`: 1.3
- `threshold_564_500000000_0`: 800000000.0


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
    date_range={'start_date': '2024-01-01', 'end_date': '2024-01-31'},
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

Generated: 2025-11-11 11:01:19
