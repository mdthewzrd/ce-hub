const { chromium } = require('playwright');

/**
 * 🔥 NATURAL RESPONSE QUALITY TEST
 * Tests that AI responses are now natural and professional instead of robotic
 */

async function testNaturalResponses() {
    console.log('🔥 NATURAL RESPONSE QUALITY TEST');
    console.log('=================================');
    console.log('Testing that responses are now conversational and professional');

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 720 }
    });

    const page = await browser.newPage();

    try {
        // Navigate to main page
        console.log('\n🌐 Navigating to main page...');
        await page.goto('http://localhost:6565/');
        await page.waitForTimeout(3000);

        // Test commands that combine navigation, display mode, and date range
        const testCommands = [
            {
                command: "show me statistics for the last 30 days",
                description: "Navigation + Date Range",
                expectsNavigation: true,
                expectsDateRange: true
            },
            {
                command: "switch to dashboard and show year to date in dollars",
                description: "Navigation + Date Range + Display Mode",
                expectsNavigation: true,
                expectsDateRange: true,
                expectsDisplayMode: true
            },
            {
                command: "show me my trades for the last 7 days",
                description: "Navigation + Date Range",
                expectsNavigation: true,
                expectsDateRange: true
            },
            {
                command: "change to r mode and show 90 days",
                description: "Display Mode + Date Range",
                expectsDisplayMode: true,
                expectsDateRange: true
            }
        ];

        const results = [];

        for (let i = 0; i < testCommands.length; i++) {
            const test = testCommands[i];
            console.log(`\n📋 TEST ${i + 1}/${testCommands.length}: ${test.description}`);
            console.log(`Command: "${test.command}"`);

            // Send API command and capture response
            const result = await page.evaluate(async (command) => {
                try {
                    const response = await fetch('/api/copilotkit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            operationName: "generateCopilotResponse",
                            query: `mutation generateCopilotResponse($data: CopilotResponseInput!) {
                                generateCopilotResponse(data: $data) {
                                    extensions { clientScript }
                                    messages { content }
                                }
                            }`,
                            variables: {
                                data: {
                                    messages: [{ content: command, role: "user" }]
                                }
                            }
                        })
                    });

                    const data = await response.json();
                    const clientScript = data?.data?.generateCopilotResponse?.extensions?.clientScript;
                    const aiMessage = data?.data?.generateCopilotResponse?.messages?.[0]?.content;

                    if (clientScript) {
                        eval(clientScript);
                    }

                    return {
                        success: true,
                        hasScript: !!clientScript,
                        aiMessage: aiMessage || 'No message',
                        rawResponse: data
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error.message,
                        aiMessage: 'Error occurred'
                    };
                }
            }, test.command);

            // Wait for actions to complete
            await page.waitForTimeout(1500);

            // Analyze response quality
            const responseAnalysis = analyzeResponseQuality(result.aiMessage, test);

            console.log(`\n💬 AI Response: "${result.aiMessage}"`);
            console.log(`🔍 Quality Analysis:`);
            console.log(`   Natural Language: ${responseAnalysis.isNatural ? '✅' : '❌'}`);
            console.log(`   Professional Tone: ${responseAnalysis.isProfessional ? '✅' : '❌'}`);
            console.log(`   Non-Robotic: ${responseAnalysis.isNotRobotic ? '✅' : '❌'}`);
            console.log(`   Contextual: ${responseAnalysis.isContextual ? '✅' : '❌'}`);
            console.log(`   API Success: ${result.success ? '✅' : '❌'}`);
            console.log(`   Script Executed: ${result.hasScript ? '✅' : '❌'}`);

            const overallQuality = responseAnalysis.isNatural &&
                                 responseAnalysis.isProfessional &&
                                 responseAnalysis.isNotRobotic &&
                                 responseAnalysis.isContextual &&
                                 result.success;

            console.log(`   Overall Quality: ${overallQuality ? '🎉 EXCELLENT' : '❌ NEEDS IMPROVEMENT'}`);

            results.push({
                ...test,
                result,
                responseAnalysis,
                overallQuality
            });

            // Short delay before next test
            await page.waitForTimeout(1000);
        }

        // Summary
        console.log('\n📊 NATURAL RESPONSE QUALITY SUMMARY');
        console.log('====================================');

        const excellentResponses = results.filter(r => r.overallQuality).length;
        const totalTests = results.length;

        console.log(`Excellent responses: ${excellentResponses}/${totalTests}`);
        console.log(`Quality success rate: ${((excellentResponses / totalTests) * 100).toFixed(1)}%`);

        results.forEach((result, i) => {
            console.log(`\n${i + 1}. ${result.description}`);
            console.log(`   Command: "${result.command}"`);
            console.log(`   Response: "${result.result.aiMessage}"`);
            console.log(`   Quality: ${result.overallQuality ? '🎉 EXCELLENT' : '❌ POOR'}`);

            if (!result.overallQuality) {
                console.log(`   Issues:`);
                if (!result.responseAnalysis.isNatural) console.log(`     - Not natural language`);
                if (!result.responseAnalysis.isProfessional) console.log(`     - Not professional tone`);
                if (!result.responseAnalysis.isNotRobotic) console.log(`     - Still sounds robotic`);
                if (!result.responseAnalysis.isContextual) console.log(`     - Not contextually appropriate`);
                if (!result.result.success) console.log(`     - API call failed`);
            }
        });

        const overallSuccess = excellentResponses === totalTests;

        if (overallSuccess) {
            console.log('\n🎉 ALL RESPONSES ARE NOW EXCELLENT!');
            console.log('✅ Natural, professional, conversational AI responses');
            console.log('🔥 Ready for user interaction with beautiful responses!');
        } else {
            console.log(`\n⚠️ ${totalTests - excellentResponses} responses need improvement`);
            console.log('❌ Some responses may still sound robotic');
        }

        return overallSuccess;

    } catch (error) {
        console.error('❌ Test error:', error.message);
        return false;
    } finally {
        await browser.close();
    }
}

// Response quality analysis function
function analyzeResponseQuality(message, test) {
    const lowerMessage = message.toLowerCase();

    // Check if it's natural (not robotic patterns)
    const roboticPatterns = [
        'navigated to',
        'switched to',
        'filtered data to',
        'settings updated',
        /\w+ed to \w+ page/,  // "navigated to statistics page"
        /\w+ed to \w+ view/,  // "switched to dollar view"
        /filtered data to/,
        /\. \w+ed to/  // ". Switched to"
    ];

    const isNotRobotic = !roboticPatterns.some(pattern => {
        if (typeof pattern === 'string') {
            return lowerMessage.includes(pattern);
        } else {
            return pattern.test(message);
        }
    });

    // Check if it uses natural language
    const naturalPhrases = [
        "let's",
        "here's",
        "i've",
        "showing",
        "looking at",
        "focusing on",
        "displaying",
        "reviewing",
        "take a look",
        "dive into"
    ];

    const isNatural = naturalPhrases.some(phrase => lowerMessage.includes(phrase));

    // Check if it's professional
    const isProfessional = message.length > 10 &&
                          !lowerMessage.includes('error') &&
                          !lowerMessage.includes('failed') &&
                          message.charAt(0) === message.charAt(0).toUpperCase();

    // Check if it's contextually appropriate
    const tradingContextWords = [
        'trading', 'performance', 'stats', 'statistics',
        'trades', 'dashboard', 'journal', 'returns',
        'analysis', 'data', 'days', 'week', 'month'
    ];

    const isContextual = tradingContextWords.some(word => lowerMessage.includes(word)) ||
                        message.length > 20; // Assume longer responses are more contextual

    return {
        isNatural,
        isProfessional,
        isNotRobotic,
        isContextual
    };
}

// Run test
testNaturalResponses()
    .then(success => {
        if (success) {
            console.log('\n✅ NATURAL RESPONSE TEST: COMPLETE SUCCESS');
            console.log('🎯 AI responses are now beautiful and professional!');
            console.log('🔥 Ready for production-quality user interactions!');
        } else {
            console.log('\n❌ NATURAL RESPONSE TEST: PARTIAL SUCCESS');
            console.log('⚠️ Some responses may still need fine-tuning');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('\n💥 Test execution failed:', error);
        process.exit(1);
    });