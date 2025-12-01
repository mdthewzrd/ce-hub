const http = require('http');

async function checkService(name, url, timeout = 10000) {
    return new Promise((resolve) => {
        const timer = setTimeout(() => {
            resolve({ name, status: 'timeout', url });
        }, timeout);

        const req = http.get(url, (res) => {
            clearTimeout(timer);
            resolve({
                name,
                status: res.statusCode === 200 ? 'healthy' : 'unhealthy',
                code: res.statusCode,
                url
            });
        });

        req.on('error', () => {
            clearTimeout(timer);
            resolve({ name, status: 'unreachable', url });
        });
    });
}

async function healthCheck() {
    console.log('🏥 Running health check...');

    const checks = [
        { name: 'Frontend', url: 'http://localhost:5665' },
        { name: 'Backend', url: 'http://localhost:8000/docs' }
    ];

    for (const check of checks) {
        const result = await checkService(check.name, check.url);
        const status = result.status === 'healthy' ? '✅' : '❌';
        console.log(`${status} ${result.name}: ${result.status} (${result.url})`);
    }
}

// Run health check in 10 seconds to allow services to start
setTimeout(healthCheck, 10000);
