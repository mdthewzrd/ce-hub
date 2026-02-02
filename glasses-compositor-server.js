/**
 * Glasses Compositor Standalone Server
 * Runs on port 7712
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 7712;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Import the glasses compositor route handler (Open Router ONLY - Claude 3.5 + Nano Banana!)
const glassesRoute = require('./glasses-api-route-openrouter-only');

// API endpoint
app.use('/api/glasses', glassesRoute);

// Serve the main page
app.get('/glasses-compositor', (req, res) => {
  res.sendFile(path.join(__dirname, 'glasses-compositor.html'));
});

// Redirect root to glasses-compositor
app.get('/', (req, res) => {
  res.redirect('/glasses-compositor');
});

app.listen(PORT, () => {
  console.log(`\n🕶️ Glasses Compositor Server running on http://localhost:${PORT}`);
  console.log(`📍 Main page: http://localhost:${PORT}/glasses-compositor`);
  console.log(`\nPress Ctrl+C to stop\n`);
});
