#!/usr/bin/env node

/**
 * Validation Gate System for CE-Hub Edge-Dev
 * Prevents false "fixed" reports by comprehensive testing
 */

const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class ValidationGate {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
    }

    log(message, color = 'white') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async checkService(name, url, expectedStatus = 200, timeout = 10000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const protocol = url.startsWith('https') ? https : http;

            const timer = setTimeout(() => {
                resolve({
                    name,
                    status: 'timeout',
                    message: `Service did not respond within ${timeout}ms`,
                    duration: Date.now() - startTime,
                    passed: false
                });
            }, timeout);

            const req = protocol.get(url, (res) => {
                clearTimeout(timer);
                const passed = res.statusCode === expectedStatus;
                resolve({
                    name,
                    status: passed ? 'healthy' : 'unhealthy',
                    message: `HTTP ${res.statusCode} (expected ${expectedStatus})`,
                    duration: Date.now() - startTime,
                    passed
                });
            });

            req.on('error', (error) => {
                clearTimeout(timer);
                resolve({
                    name,
                    status: 'error',
                    message: error.message,
                    duration: Date.now() - startTime,
                    passed: false
                });
            });
        });
    }

    async runCommand(command, description) {
        return new Promise((resolve) => {
            exec(command, (error, stdout, stderr) => {
                resolve({
                    name: description,
                    command,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    passed: !error,
                    exitCode: error ? error.code : 0
                });
            });
        });
    }

    async checkFileExists(filePath, description) {
        const exists = fs.existsSync(filePath);
        return {
            name: description,
            path: filePath,
            exists,
            passed: exists,
            message: exists ? 'File exists' : 'File not found'
        };
    }

    recordResult(result) {
        this.results.details.push(result);
        if (result.passed) {
            this.results.passed++;
        } else if (result.warning) {
            this.results.warnings++;
        } else {
            this.results.failed++;
        }
    }

    async runBasicHealthChecks() {
        this.log('\n🏥 Running Basic Health Checks...', 'cyan');
        this.log('=====================================', 'cyan');

        // Check if services are running
        const serviceChecks = [
            { name: 'Frontend Service', url: 'http://localhost:5657', expectedStatus: 200 },
            { name: 'Backend API Health', url: 'http://localhost:8000/docs', expectedStatus: 200 }
        ];

        for (const check of serviceChecks) {
            const result = await this.checkService(check.name, check.url, check.expectedStatus);
            this.recordResult(result);

            const icon = result.passed ? '✅' : '❌';
            const color = result.passed ? 'green' : 'red';
            this.log(`${icon} ${result.name}: ${result.status} (${result.duration}ms)`, color);
            if (!result.passed) {
                this.log(`   Error: ${result.message}`, 'red');
            }
        }
    }

    async runAPIFunctionalityTests() {
        this.log('\n🔧 Running API Functionality Tests...', 'cyan');
        this.log('======================================', 'cyan');

        // Test critical API endpoints
        const apiTests = [
            {
                name: 'Scanner API Endpoint',
                url: 'http://localhost:8000/api/scan/execute',
                method: 'POST',
                payload: {
                    scanner_type: "test",
                    symbols: ["AAPL"],
                    test_mode: true
                },
                expectedStatus: 200
            }
        ];

        for (const test of apiTests) {
            try {
                const result = await this.testAPIEndpoint(test);
                this.recordResult(result);

                const icon = result.passed ? '✅' : '❌';
                const color = result.passed ? 'green' : 'red';
                this.log(`${icon} ${result.name}: ${result.message}`, color);
            } catch (error) {
                const result = {
                    name: test.name,
                    passed: false,
                    message: error.message
                };
                this.recordResult(result);
                this.log(`❌ ${result.name}: ${result.message}`, 'red');
            }
        }
    }

    async testAPIEndpoint(test) {
        return new Promise((resolve) => {
            const postData = JSON.stringify(test.payload || {});
            const options = {
                hostname: 'localhost',
                port: 8000,
                path: new URL(test.url).pathname,
                method: test.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData),
                },
            };

            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    const passed = res.statusCode === test.expectedStatus;
                    resolve({
                        name: test.name,
                        passed,
                        message: passed
                            ? `API responded correctly (${res.statusCode})`
                            : `API returned ${res.statusCode}, expected ${test.expectedStatus}`,
                        statusCode: res.statusCode,
                        responseData: data
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    name: test.name,
                    passed: false,
                    message: `API request failed: ${error.message}`
                });
            });

            if (test.method === 'POST') {
                req.write(postData);
            }
            req.end();
        });
    }

    async runFileSystemChecks() {
        this.log('\n📁 Running File System Checks...', 'cyan');
        this.log('=================================', 'cyan');

        const fileChecks = [
            { path: './package.json', name: 'Frontend package.json' },
            { path: './backend/main.py', name: 'Backend main.py' },
            { path: './backend/requirements.txt', name: 'Backend requirements.txt' },
            { path: './src/app/page.tsx', name: 'Frontend main page' }
        ];

        for (const check of fileChecks) {
            const result = await this.checkFileExists(check.path, check.name);
            this.recordResult(result);

            const icon = result.passed ? '✅' : '❌';
            const color = result.passed ? 'green' : 'red';
            this.log(`${icon} ${result.name}: ${result.message}`, color);
        }
    }

    async runDependencyChecks() {
        this.log('\n📦 Running Dependency Checks...', 'cyan');
        this.log('===============================', 'cyan');

        const dependencyChecks = [
            { command: 'node --version', description: 'Node.js version' },
            { command: 'npm --version', description: 'npm version' },
            { command: 'python3 --version', description: 'Python version' },
            { command: 'pip --version', description: 'pip version' }
        ];

        for (const check of dependencyChecks) {
            const result = await this.runCommand(check.command, check.description);
            this.recordResult(result);

            const icon = result.passed ? '✅' : '❌';
            const color = result.passed ? 'green' : 'red';
            this.log(`${icon} ${result.name}: ${result.stdout || result.stderr}`, color);
        }
    }

    async runSecurityChecks() {
        this.log('\n🔒 Running Security Checks...', 'cyan');
        this.log('=============================', 'cyan');

        // Check for common security issues
        const securityChecks = [
            {
                name: 'No exposed .env files',
                check: () => !fs.existsSync('.env') || !fs.readFileSync('.env', 'utf8').includes('SECRET_KEY='),
                message: 'Environment files properly configured'
            },
            {
                name: 'Backend CORS configuration',
                check: () => fs.existsSync('./backend/main.py') &&
                    fs.readFileSync('./backend/main.py', 'utf8').includes('CORSMiddleware'),
                message: 'CORS middleware properly configured'
            }
        ];

        for (const check of securityChecks) {
            const passed = check.check();
            const result = { name: check.name, passed, message: check.message };
            this.recordResult(result);

            const icon = passed ? '✅' : '⚠️';
            const color = passed ? 'green' : 'yellow';
            this.log(`${icon} ${check.name}: ${check.message}`, color);
        }
    }

    generateReport() {
        this.log('\n📊 Validation Report', 'cyan');
        this.log('===================', 'cyan');

        const total = this.results.passed + this.results.failed + this.results.warnings;
        const passRate = ((this.results.passed / total) * 100).toFixed(1);

        this.log(`✅ Passed: ${this.results.passed}`, 'green');
        this.log(`❌ Failed: ${this.results.failed}`, 'red');
        this.log(`⚠️  Warnings: ${this.results.warnings}`, 'yellow');
        this.log(`📈 Pass Rate: ${passRate}%`, passRate > 80 ? 'green' : 'red');

        if (this.results.failed === 0) {
            this.log('\n🎉 All critical checks passed! System is healthy.', 'green');
            return true;
        } else {
            this.log('\n🚨 Some checks failed. System issues detected.', 'red');
            this.log('\nFailed checks:', 'yellow');
            this.results.details
                .filter(detail => !detail.passed && !detail.warning)
                .forEach(detail => {
                    this.log(`  - ${detail.name}: ${detail.message || 'Failed'}`, 'red');
                });
            return false;
        }
    }

    async run() {
        this.log('🔍 CE-Hub Validation Gate Starting...', 'blue');
        this.log('=====================================', 'blue');

        try {
            await this.runBasicHealthChecks();
            await this.runFileSystemChecks();
            await this.runDependencyChecks();
            await this.runAPIFunctionalityTests();
            await this.runSecurityChecks();

            const success = this.generateReport();
            process.exit(success ? 0 : 1);
        } catch (error) {
            this.log(`\n💥 Validation failed with error: ${error.message}`, 'red');
            process.exit(1);
        }
    }
}

// Run validation if script is executed directly
if (require.main === module) {
    const validator = new ValidationGate();
    validator.run();
}

module.exports = ValidationGate;