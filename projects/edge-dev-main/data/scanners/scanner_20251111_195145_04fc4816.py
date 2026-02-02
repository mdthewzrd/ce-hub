import pandas as pd

def test_scanner_1():
    print("Test Scanner 1 executing")
    return pd.DataFrame({'signal': [1, 0, 1]})

if __name__ == "__main__":
    test_scanner_1()