def backside_b_scanner(data):
    """
    Scans for Backside B pattern in the given data.
    
    Parameters:
    - data: DataFrame with columns ['ticker', 'open', 'close', 'high', 'low', 'volume']
    
    Returns:
    - DataFrame with columns ['ticker', 'gap', 'volume', 'bounce_score']
    """
    import pandas as pd
    
    # Calculate the gap down
    data['gap'] = (data['open'] - data['close'].shift(1)) / data['close'].shift(1) * 100
    
    # Filter for gap down <= -1.0%
    gap_down = data[data['gap'] <= -1.0]
    
    # Filter for volume spike >= 500,000
    volume_spike = gap_down[gap_down['volume'] >= 500000]
    
    # Calculate bounce potential score
    # Bounce potential score is a simple heuristic: higher the volume and lower the gap, higher the score
    volume_weight = 0.7
    gap_weight = 0.3
    volume_spike['bounce_score'] = (volume_spike['volume'] / 500000) * volume_weight + ((-1 * volume_spike['gap']) / 100) * gap_weight
    
    # Return the results
    results = volume_spike[['ticker', 'gap', 'volume', 'bounce_score']]
    
    return results