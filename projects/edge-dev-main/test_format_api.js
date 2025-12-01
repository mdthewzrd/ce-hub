#!/usr/bin/env node

/**
 * Test OpenRouter formatting through the web API
 */

const http = require('http');

const testCode = `def scan_symbol(ticker, from_date, to_date):
    # Simple test scanner
    print(f"Scanning {ticker} from {from_date} to {to_date}")
    gap_percent = 5.0
    volume_ratio = 2.0
    return {
        'ticker': ticker,
        'gap_percent': gap_percent,
        'volume_ratio': volume_ratio,
        'signal': 'BUY'
    }`;

function testFormattingAPI() {
    return new Promise((resolve, reject) => {
        console.log('🧪 Testing OpenRouter formatting through web API...\n');

        const postData = JSON.stringify({
            message: `format this\n\n${testCode}`,
            personality: 'renata',
            systemPrompt: 'You are a helpful AI assistant',
            context: {}
        });

        const options = {
            hostname: 'localhost',
            port: 5657,
            path: '/api/renata/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ SUCCESS! Web API responded');
                    console.log('📊 Response:', {
                        success: response.message ? 'true' : 'false',
                        type: response.type,
                        timestamp: response.timestamp
                    });

                    if (response.data) {
                        console.log('📝 Data keys:', Object.keys(response.data));
                    }

                    if (response.message) {
                        console.log('💬 Message:', response.message.substring(0, 200) + (response.message.length > 200 ? '...' : ''));
                    }

                    if (response.error) {
                        console.log('❌ Error in response:', response.error);
                    }

                    resolve(true);
                } catch (error) {
                    console.error('❌ Failed to parse response:', error.message);
                    console.log('Raw response:', data.substring(0, 500));
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Request failed:', error.message);
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

testFormattingAPI().then(success => {
    process.exit(success ? 0 : 1);
});