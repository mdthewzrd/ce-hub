"""
Unit tests for AST Parser

Tests the AST parsing functionality to ensure it correctly extracts
information from trading scanner code.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path to import RENATA_V2
sys.path.insert(0, str(Path(__file__).parent.parent))

from RENATA_V2.core.ast_parser import (
    ASTParser,
    ScannerType,
    ClassificationResult
)


class TestASTParser:
    """Test AST parser functionality"""

    def test_parse_simple_code(self):
        """Test parsing simple Python code"""
        parser = ASTParser()
        code = """
def scan_stocks():
    stocks = ['AAPL', 'TSLA']
    for stock in stocks:
        if stock['price'] > 50:
            print(stock['ticker'])
    return stocks
"""

        tree = parser.parse_code(code)
        assert tree is not None

        functions = parser.extract_functions()
        assert len(functions) == 1
        assert functions[0].name == 'scan_stocks'

    def test_extract_functions(self):
        """Test function extraction"""
        parser = ASTParser()
        code = """
class Scanner:
    def fetch_data(self):
        return []

    def check_pattern(self, stock):
        return stock['price'] > 50
"""

        parser.parse_code(code)
        functions = parser.extract_functions()

        assert len(functions) == 2
        assert functions[0].name == 'fetch_data'
        assert functions[1].name == 'check_pattern'

    def test_extract_classes(self):
        """Test class extraction"""
        parser = ASTParser()
        code = """
class MyScanner:
    def __init__(self):
        self.api_key = 'test'

    def scan(self):
        pass
"""

        parser.parse_code(code)
        classes = parser.extract_classes()

        assert len(classes) == 1
        assert classes[0].name == 'MyScanner'
        assert '__init__' in classes[0].methods
        assert 'scan' in classes[0].methods

    def test_extract_comparisons(self):
        """Test comparison extraction"""
        parser = ASTParser()
        code = """
if stock['price'] > 50:
    results.append(stock)
elif volume >= 1_000_000:
    results.append(stock)
"""

        parser.parse_code(code)
        comparisons = parser.extract_comparisons()

        assert len(comparisons) == 2
        assert comparisons[0].operator == '>'
        assert comparisons[0].right == '50'
        assert comparisons[1].operator == '>='

    def test_classify_single_scanner(self):
        """Test single-scanner classification"""
        parser = ASTParser()
        code = """
class SingleScanner:
    def scan(self):
        results = []
        # Only one pattern
        if data['gap'] > 0.5:
            results.append(data)
        return results
"""

        parser.parse_code(code)
        result = parser.classify_scanner_type()

        assert result.scanner_type == ScannerType.SINGLE_SCANNER
        assert result.confidence in ['high', 'medium']

    def test_classify_multi_scanner(self):
        """Test multi-scanner classification"""
        parser = ASTParser()
        code = """
class MultiScanner:
    def scan(self):
        results = {}
        # Multiple patterns
        results['d2_pattern'] = self.check_d2(data)
        results['d3_pattern'] = self.check_d3(data)
        results['d4_pattern'] = self.check_d4(data)
        return results

    def check_d2(self, data):
        pass

    def check_d3(self, data):
        pass

    def check_d4(self, data):
        pass
"""

        parser.parse_code(code)
        result = parser.classify_scanner_type()

        assert result.scanner_type == ScannerType.MULTI_SCANNER
        assert result.confidence == 'high'

    def test_detect_polygon_usage(self):
        """Test Polygon API detection"""
        parser = ASTParser()
        code = """
import requests

url = "https://api.polygon.io/v2/aggs/grouped/..."
response = requests.get(url)
"""

        parser.parse_code(code)
        sources = parser.detect_data_sources()

        assert sources.polygon_usage is True
        assert sources.primary_source == 'polygon_api'

    def test_detect_file_usage(self):
        """Test file source detection"""
        parser = ASTParser()
        code = """
import pandas as pd

data = pd.read_csv('stock_data.csv')
"""

        parser.parse_code(code)
        sources = parser.detect_data_sources()

        assert len(sources.files) > 0
        assert sources.primary_source == 'file'

    def test_extract_numeric_literals(self):
        """Test numeric literal extraction"""
        parser = ASTParser()
        code = """
min_price = 0.75
min_volume = 1_000_000
gap_threshold = 0.5
"""

        parser.parse_code(code)
        parameters = parser.extract_numeric_literals()

        assert 'min_price' in parameters
        assert parameters['min_price']['value'] == 0.75
        assert 'min_volume' in parameters
        assert 'gap_threshold' in parameters

    def test_get_code_statistics(self):
        """Test code statistics"""
        parser = ASTParser()
        code = """
import pandas as pd

class Scanner:
    def scan(self):
        pass

def main():
    pass
"""

        parser.parse_code(code)
        stats = parser.get_code_statistics()

        assert stats['total_functions'] == 2
        assert stats['total_classes'] == 1
        assert stats['total_imports'] == 1


class TestRealScanners:
    """Test with actual scanner files"""

    def test_a_plus_scanner(self):
        """Test parsing A+ Parabolic scanner"""
        parser = ASTParser()

        scanner_file = Path(__file__).parent.parent / 'tests' / 'data' / 'a_plus_scanner.py'

        if not scanner_file.exists():
            pytest.skip("Test scanner file not found")

        with open(scanner_file, 'r') as f:
            code = f.read()

        # Parse code
        parser.parse_code(code)

        # Extract info
        functions = parser.extract_functions()
        assert len(functions) > 0

        comparisons = parser.extract_comparisons()
        assert len(comparisons) > 0

        # Classify as single-scanner
        result = parser.classify_scanner_type()
        assert result.scanner_type == ScannerType.SINGLE_SCANNER

    def test_dmr_scanner(self):
        """Test parsing DMR multi-scanner"""
        parser = ASTParser()

        scanner_file = Path(__file__).parent.parent / 'tests' / 'data' / 'dmr_scanner.py'

        if not scanner_file.exists():
            pytest.skip("Test scanner file not found")

        with open(scanner_file, 'r') as f:
            code = f.read()

        # Parse code
        parser.parse_code(code)

        # Classify as multi-scanner
        result = parser.classify_scanner_type()
        assert result.scanner_type == ScannerType.MULTI_SCANNER
        assert result.confidence == 'high'
        assert result.indicators['pattern_count'] >= 3


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v'])
