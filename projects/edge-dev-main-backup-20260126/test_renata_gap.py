def calculate_gap(open_price, close_price):
    gap = ((open_price - close_price) / close_price) * 100
    return gap