/**
 * DEBUG CSV PARSING
 * Investigate why trades are being filtered out
 */

const fs = require('fs');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  result.push(current.trim());
  return result;
}

function debugCSVParsing() {
  console.log('🔍 Debugging CSV Parsing - Investigating Missing Trades');
  console.log('='.repeat(70));

  const csvFilePath = '/Users/michaeldurante/Downloads/trades.csv';
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  console.log(`Total lines in file: ${lines.length}`);
  console.log(`Expected data rows: ${lines.length - 1} (excluding header)`);

  let headerLine = lines[0];
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1);
  }

  const headers = parseCSVLine(headerLine).map(h => h.trim());
  console.log(`Headers found: ${headers.length}`);
  console.log('Key headers:', headers.slice(0, 10));

  let validTrades = 0;
  let filteredTrades = 0;
  const filterReasons = {
    noSymbol: 0,
    noDateTime: 0,
    parseError: 0,
    emptyRow: 0
  };

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i]);

      if (values.length === 0) {
        filterReasons.emptyRow++;
        filteredTrades++;
        console.log(`Row ${i + 1}: Empty row`);
        continue;
      }

      const trade = {};
      headers.forEach((header, index) => {
        trade[header] = index < values.length ? values[index].trim() : '';
      });

      // Check filtering conditions
      const symbol = trade['Symbol'];
      const openDateTime = trade['Open Datetime'];
      const closeDateTime = trade['Close Datetime'];

      if (!symbol || symbol.trim() === '') {
        filterReasons.noSymbol++;
        filteredTrades++;
        console.log(`Row ${i + 1}: No symbol - "${symbol}"`);
        continue;
      }

      if (!openDateTime && !closeDateTime) {
        filterReasons.noDateTime++;
        filteredTrades++;
        console.log(`Row ${i + 1}: No datetime - Open: "${openDateTime}", Close: "${closeDateTime}"`);
        continue;
      }

      validTrades++;

    } catch (error) {
      filterReasons.parseError++;
      filteredTrades++;
      console.log(`Row ${i + 1}: Parse error - ${error.message}`);
    }
  }

  console.log('');
  console.log('📊 PARSING RESULTS');
  console.log('-'.repeat(40));
  console.log(`Valid trades: ${validTrades}`);
  console.log(`Filtered trades: ${filteredTrades}`);
  console.log('');
  console.log('📋 FILTER REASONS');
  console.log('-'.repeat(40));
  console.log(`No symbol: ${filterReasons.noSymbol}`);
  console.log(`No datetime: ${filterReasons.noDateTime}`);
  console.log(`Parse errors: ${filterReasons.parseError}`);
  console.log(`Empty rows: ${filterReasons.emptyRow}`);

  // Show some examples of filtered rows
  console.log('');
  console.log('🔍 SAMPLE FILTERED ROWS');
  console.log('-'.repeat(40));

  let sampleCount = 0;
  for (let i = 1; i < lines.length && sampleCount < 5; i++) {
    try {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0) {
        const trade = {};
        headers.forEach((header, index) => {
          trade[header] = index < values.length ? values[index].trim() : '';
        });

        const symbol = trade['Symbol'];
        const openDateTime = trade['Open Datetime'];
        const closeDateTime = trade['Close Datetime'];

        if (!symbol || (!openDateTime && !closeDateTime)) {
          console.log(`Row ${i + 1}:`);
          console.log(`  Symbol: "${symbol}"`);
          console.log(`  Open Datetime: "${openDateTime}"`);
          console.log(`  Close Datetime: "${closeDateTime}"`);
          console.log(`  Raw line: ${lines[i].substring(0, 100)}...`);
          sampleCount++;
        }
      }
    } catch (error) {
      // Skip parse errors for sample
    }
  }

  return {
    totalLines: lines.length,
    validTrades,
    filteredTrades,
    filterReasons
  };
}

if (require.main === module) {
  debugCSVParsing();
}