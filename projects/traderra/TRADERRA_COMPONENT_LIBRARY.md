# TRADERRA COMPONENT LIBRARY
**Ready-to-Use Components for Cross-Platform Implementation**

*Companion to TRADERRA_BRAND_KIT_COMPLETE.md*

---

## 🏗️ **CSS FRAMEWORK SETUP**

### Required CSS Variables (Copy Exactly)
```css
:root {
  /* Traderra Brand Colors */
  --primary: 45 93% 35%;                 /* #D4AF37 */
  --primary-foreground: 0 0% 98%;        /* #F7F7F7 */
  --secondary: 0 0% 10%;                 /* #191919 */
  --secondary-foreground: 0 0% 90%;      /* #e5e5e5 */
  --accent: 0 0% 10%;                    /* #191919 */
  --accent-foreground: 0 0% 90%;         /* #e5e5e5 */

  /* Backgrounds */
  --background: 0 0% 4%;                 /* #0a0a0a */
  --card: 0 0% 7%;                       /* #111111 */
  --popover: 0 0% 7%;                    /* #111111 */
  --muted: 0 0% 10%;                     /* #191919 */

  /* Text Colors */
  --foreground: 0 0% 90%;                /* #e5e5e5 */
  --muted-foreground: 0 0% 40%;          /* #666666 */
  --card-foreground: 0 0% 90%;           /* #e5e5e5 */

  /* Borders & Inputs */
  --border: 0 0% 10%;                    /* #1a1a1a */
  --input: 0 0% 10%;                     /* #1a1a1a */
  --ring: 214 100% 59%;                  /* #3b82f6 */

  /* Status Colors */
  --destructive: 0 72% 51%;              /* #ef4444 */
  --destructive-foreground: 0 0% 98%;

  /* Trading Colors */
  --trading-profit: 158 64% 52%;         /* #10b981 */
  --trading-loss: 0 72% 51%;             /* #ef4444 */
  --trading-neutral: 220 9% 46%;         /* #6b7280 */

  /* Studio Extensions */
  --studio-gold: #D4AF37;
  --studio-bg: #0a0a0a;
  --studio-surface: #111111;
  --studio-border: #1a1a1a;
  --studio-text: #e5e5e5;
  --studio-muted: #666666;
}

/* Force Dark Mode (REQUIRED) */
.dark {
  color-scheme: dark;
}

html, body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: 'Inter', system-ui, sans-serif;
}
```

### Base Utility Classes
```css
/* Background Classes */
.studio-bg { background-color: var(--studio-bg); }
.studio-surface { background-color: var(--studio-surface); }

/* Text Classes */
.studio-text { color: var(--studio-text); }
.studio-muted { color: var(--studio-muted); }

/* Border Classes */
.studio-border { border-color: var(--studio-border); }

/* Shadow System */
.shadow-studio {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

.shadow-studio-lg {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.1),
    0 1px 0px rgba(255, 255, 255, 0.08) inset,
    0 -1px 0px rgba(0, 0, 0, 0.15) inset;
}

.shadow-interactive {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.2s ease-out;
}

.shadow-interactive:hover {
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

/* Font Classes */
.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}

.metric-value {
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.metric-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--studio-muted);
}
```

---

## 🔘 **BUTTON COMPONENTS**

### Primary Button (Gold)
```html
<button class="btn-primary">
  Primary Action
</button>

<style>
.btn-primary {
  background-color: var(--studio-gold);
  color: #F7F7F7;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.2s ease-out;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.15);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2);
}

.btn-primary:focus {
  outline: none;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset,
    0 0 0 2px rgba(212, 175, 55, 0.3);
}
</style>
```

### Secondary Button
```html
<button class="btn-secondary">
  Secondary Action
</button>

<style>
.btn-secondary {
  background-color: var(--studio-surface);
  color: var(--studio-text);
  border: 1px solid var(--studio-border);
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease-out;
}

.btn-secondary:hover {
  background-color: #161616;
  transform: translateY(-1px);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>
```

### Ghost Button
```html
<button class="btn-ghost">
  Ghost Action
</button>

<style>
.btn-ghost {
  background-color: transparent;
  color: var(--studio-text);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease-out;
}

.btn-ghost:hover {
  background-color: rgba(255, 255, 255, 0.05);
}
</style>
```

---

## 📦 **CARD COMPONENTS**

### Standard Card
```html
<div class="studio-card">
  <h3 class="card-title">Card Title</h3>
  <p class="card-content">Card content goes here with proper spacing and styling.</p>
  <button class="btn-primary">Action</button>
</div>

<style>
.studio-card {
  background-color: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.2s ease-out;
}

.studio-card:hover {
  background-color: #161616;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2);
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--studio-text);
  margin-bottom: 0.5rem;
}

.card-content {
  color: var(--studio-muted);
  line-height: 1.6;
  margin-bottom: 1rem;
}
</style>
```

### Metric Tile
```html
<div class="metric-tile">
  <div class="metric-value pnl-positive">+$1,247.50</div>
  <div class="metric-label">Today's P&L</div>
</div>

<style>
.metric-tile {
  background-color: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
}

.metric-tile:hover {
  background-color: #161616;
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2);
}

.metric-value {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.5rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  margin-bottom: 0.25rem;
}

.metric-label {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--studio-muted);
  font-weight: 500;
}

.pnl-positive { color: hsl(var(--trading-profit)); }
.pnl-negative { color: hsl(var(--trading-loss)); }
.pnl-neutral { color: hsl(var(--trading-neutral)); }
</style>
```

### Chart Container
```html
<div class="chart-container">
  <div class="chart-header">
    <h3 class="chart-title">Performance Chart</h3>
    <div class="chart-controls">
      <!-- Chart controls here -->
    </div>
  </div>
  <div class="chart-content">
    <!-- Chart component here -->
  </div>
</div>

<style>
.chart-container {
  background-color: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  min-height: 400px;
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.25),
    0 8px 16px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.1),
    0 1px 0px rgba(255, 255, 255, 0.08) inset,
    0 -1px 0px rgba(0, 0, 0, 0.15) inset;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--studio-border);
}

.chart-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--studio-text);
}

.chart-content {
  height: 300px;
  position: relative;
}
</style>
```

---

## 📝 **FORM COMPONENTS**

### Input Field
```html
<div class="form-group">
  <label for="example-input" class="form-label">Input Label</label>
  <input type="text" id="example-input" class="studio-input" placeholder="Enter value...">
</div>

<style>
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--studio-text);
  margin-bottom: 0.5rem;
}

.studio-input {
  width: 100%;
  background-color: #1a1a1a;
  border: 1px solid #2a2a2a;
  color: var(--studio-text);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2) inset,
    0 1px 0px rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease-out;
}

.studio-input::placeholder {
  color: var(--studio-muted);
}

.studio-input:focus {
  outline: none;
  border-color: var(--studio-gold);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3) inset,
    0 0 0 2px rgba(212, 175, 55, 0.2),
    0 2px 4px rgba(0, 0, 0, 0.15);
}

.studio-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
```

### Select Dropdown
```html
<div class="form-group">
  <label for="example-select" class="form-label">Select Option</label>
  <select id="example-select" class="studio-select">
    <option value="">Choose an option...</option>
    <option value="option1">Option 1</option>
    <option value="option2">Option 2</option>
    <option value="option3">Option 3</option>
  </select>
</div>

<style>
.studio-select {
  width: 100%;
  background-color: #1a1a1a;
  border: 1px solid #2a2a2a;
  color: var(--studio-text);
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.2) inset,
    0 1px 0px rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease-out;
}

.studio-select:focus {
  outline: none;
  border-color: var(--studio-gold);
  box-shadow:
    0 1px 3px rgba(0, 0, 0, 0.3) inset,
    0 0 0 2px rgba(212, 175, 55, 0.2);
}

.studio-select option {
  background-color: #1a1a1a;
  color: var(--studio-text);
}
</style>
```

---

## 📊 **TABLE COMPONENTS**

### Trading Table
```html
<div class="table-container">
  <table class="studio-table">
    <thead>
      <tr>
        <th>Symbol</th>
        <th>Qty</th>
        <th>Entry Price</th>
        <th>Current Price</th>
        <th>P&L</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>AAPL</td>
        <td class="font-mono">100</td>
        <td class="font-mono">$150.00</td>
        <td class="font-mono">$155.25</td>
        <td class="font-mono pnl-positive">+$525.00</td>
      </tr>
      <tr>
        <td>TSLA</td>
        <td class="font-mono">50</td>
        <td class="font-mono">$800.00</td>
        <td class="font-mono">$785.50</td>
        <td class="font-mono pnl-negative">-$725.00</td>
      </tr>
    </tbody>
  </table>
</div>

<style>
.table-container {
  background-color: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15),
    0 1px 0px rgba(255, 255, 255, 0.05) inset;
}

.studio-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.studio-table thead th {
  background-color: #0f0f0f;
  color: var(--studio-text);
  border-bottom: 1px solid var(--studio-border);
  padding: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.studio-table tbody td {
  padding: 0.75rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.5);
  color: var(--studio-text);
}

.studio-table tbody tr:hover {
  background-color: rgba(128, 128, 128, 0.05);
  cursor: pointer;
}

.studio-table tbody tr.selected {
  background-color: rgba(212, 175, 55, 0.1);
  border: 1px solid rgba(212, 175, 55, 0.3);
}
</style>
```

---

## 💬 **CHAT COMPONENTS**

### Chat Message (User)
```html
<div class="chat-message user-message">
  <div class="message-content">
    Go to statistics page and show R-multiple view
  </div>
  <div class="message-timestamp">2:30 PM</div>
</div>

<style>
.chat-message {
  display: flex;
  width: 100%;
  margin-bottom: 1rem;
}

.user-message {
  justify-content: flex-end;
}

.user-message .message-content {
  background-color: var(--studio-gold);
  color: #F7F7F7;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  max-width: 80%;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-timestamp {
  font-size: 0.75rem;
  color: var(--studio-muted);
  margin-top: 0.25rem;
  text-align: right;
}
</style>
```

### Chat Message (AI Assistant)
```html
<div class="chat-message ai-message">
  <div class="message-wrapper">
    <div class="stage-indicator">
      <div class="stage-dot stage-completion"></div>
      <span class="stage-text">Stage 2: Execution & Validation</span>
    </div>
    <div class="message-content">
      ✅ **All Done!** I've completed multiple actions:

      • ✅ Navigated to statistics page
      • ✅ Display mode set to R-multiple

      🔍 **Validation:** All changes verified and systems are working correctly.

      *Execution time: 2347ms*
    </div>
    <div class="message-footer">
      <span class="message-timestamp">2:31 PM</span>
      <span class="validation-status success">✓ Validated</span>
    </div>
  </div>
</div>

<style>
.ai-message {
  justify-content: flex-start;
}

.ai-message .message-wrapper {
  max-width: 80%;
}

.stage-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(26, 26, 26, 0.5);
}

.stage-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  margin-right: 0.5rem;
}

.stage-planning { background-color: #3b82f6; }
.stage-completion { background-color: #10b981; }

.stage-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #10b981;
}

.ai-message .message-content {
  background-color: var(--studio-surface);
  color: var(--studio-text);
  border: 1px solid var(--studio-border);
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  line-height: 1.6;
  white-space: pre-wrap;
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.15),
    0 1px 3px rgba(0, 0, 0, 0.1);
}

.message-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.25rem;
}

.validation-status {
  font-size: 0.75rem;
  font-weight: 500;
}

.validation-status.success {
  color: #10b981;
}

.validation-status.error {
  color: #ef4444;
}
</style>
```

---

## 🧭 **NAVIGATION COMPONENTS**

### Top Navigation
```html
<nav class="studio-header">
  <div class="nav-brand">
    <div class="brand-icon">
      <div class="brand-logo"></div>
    </div>
    <span class="brand-text">Traderra</span>
  </div>

  <div class="nav-links">
    <a href="/dashboard" class="nav-link active">Dashboard</a>
    <a href="/trades" class="nav-link">Trades</a>
    <a href="/statistics" class="nav-link">Statistics</a>
    <a href="/journal" class="nav-link">Journal</a>
  </div>

  <div class="nav-actions">
    <button class="btn-ghost">Settings</button>
  </div>
</nav>

<style>
.studio-header {
  height: 4rem;
  background-color: var(--studio-surface);
  border-bottom: 1px solid var(--studio-border);
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.15);
}

.nav-brand {
  display: flex;
  align-items: center;
}

.brand-icon {
  width: 2rem;
  height: 2rem;
  background-color: rgba(212, 175, 55, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
}

.brand-logo {
  width: 1rem;
  height: 1rem;
  background-color: var(--studio-gold);
  border-radius: 0.125rem;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--studio-text);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--studio-muted);
  text-decoration: none;
  padding: 0.5rem 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease-out;
}

.nav-link:hover {
  background-color: #161616;
  color: var(--studio-text);
}

.nav-link.active {
  background-color: rgba(212, 175, 55, 0.1);
  color: var(--studio-gold);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
```

---

## 📱 **STATUS COMPONENTS**

### Status Badge
```html
<span class="status-badge status-online">Online</span>
<span class="status-badge status-offline">Offline</span>
<span class="status-badge status-loading">Processing</span>

<style>
.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
}

.status-online {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-offline {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-loading {
  background-color: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(251, 191, 36, 0.2);
}
</style>
```

### Loading Spinner
```html
<div class="loading-spinner"></div>

<style>
.loading-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(212, 175, 55, 0.3);
  border-top: 2px solid var(--studio-gold);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

---

## 📋 **LAYOUT TEMPLATES**

### Dashboard Layout
```html
<!DOCTYPE html>
<html class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traderra Dashboard</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link href="traderra-styles.css" rel="stylesheet">
</head>
<body>
  <!-- Navigation -->
  <nav class="studio-header">
    <!-- Navigation content -->
  </nav>

  <!-- Main Content -->
  <main class="main-content">
    <div class="container">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <div class="page-actions">
          <button class="btn-primary">New Trade</button>
        </div>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-tile">
          <div class="metric-value pnl-positive">+$2,450.75</div>
          <div class="metric-label">Total P&L</div>
        </div>
        <!-- More metric tiles -->
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <!-- Chart content -->
        </div>
      </div>
    </div>
  </main>
</body>
</html>

<style>
.main-content {
  padding: 2rem;
  background-color: var(--studio-bg);
  min-height: calc(100vh - 4rem);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--studio-border);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--studio-text);
}

.page-actions {
  display: flex;
  gap: 0.5rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.charts-section {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .charts-section {
    grid-template-columns: 2fr 1fr;
  }
}
</style>
```

---

## 🎯 **RESPONSIVE UTILITIES**

### Breakpoint Classes
```css
/* Mobile First Responsive Design */

/* Hide on mobile, show on tablet+ */
.hidden-mobile {
  display: none;
}

@media (min-width: 768px) {
  .hidden-mobile {
    display: block;
  }
}

/* Show on mobile, hide on tablet+ */
.mobile-only {
  display: block;
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }
}

/* Responsive Grid */
.responsive-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .responsive-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Responsive Text */
.responsive-text {
  font-size: 1rem;
}

@media (min-width: 768px) {
  .responsive-text {
    font-size: 1.125rem;
  }
}

@media (min-width: 1024px) {
  .responsive-text {
    font-size: 1.25rem;
  }
}

/* Responsive Padding */
.responsive-padding {
  padding: 1rem;
}

@media (min-width: 768px) {
  .responsive-padding {
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .responsive-padding {
    padding: 2rem;
  }
}
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### Required Setup
- [ ] Add CSS variables to :root
- [ ] Include Inter and JetBrains Mono fonts
- [ ] Add dark class to html element
- [ ] Set body background to #0a0a0a
- [ ] Import component styles

### For Each Component
- [ ] Uses studio color variables
- [ ] Has multi-layer shadow
- [ ] Includes hover states
- [ ] Has proper focus states
- [ ] Uses correct border radius (6px)
- [ ] Implements 200ms transitions
- [ ] Responsive on all screen sizes

### Trading-Specific
- [ ] P&L uses green/red colors
- [ ] Financial numbers use tabular nums
- [ ] JetBrains Mono for numeric data
- [ ] Status indicators with proper colors

---

## 🚀 **QUICK COPY-PASTE**

### Complete Starter CSS
```css
/* Copy this entire block for instant Traderra styling */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600&display=swap');

:root {
  --primary: 45 93% 35%;
  --primary-foreground: 0 0% 98%;
  --background: 0 0% 4%;
  --card: 0 0% 7%;
  --foreground: 0 0% 90%;
  --muted-foreground: 0 0% 40%;
  --border: 0 0% 10%;
  --studio-gold: #D4AF37;
  --studio-bg: #0a0a0a;
  --studio-surface: #111111;
  --studio-border: #1a1a1a;
  --studio-text: #e5e5e5;
  --studio-muted: #666666;
  --trading-profit: #10b981;
  --trading-loss: #ef4444;
}

html, body {
  background-color: var(--studio-bg);
  color: var(--studio-text);
  font-family: 'Inter', system-ui, sans-serif;
}

.btn-primary {
  background-color: var(--studio-gold);
  color: #F7F7F7;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), 0 1px 0px rgba(255,255,255,0.05) inset;
  transition: all 0.2s ease-out;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.studio-card {
  background-color: var(--studio-surface);
  border: 1px solid var(--studio-border);
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15), 0 1px 0px rgba(255,255,255,0.05) inset;
  transition: all 0.2s ease-out;
}

.studio-card:hover {
  background-color: #161616;
  transform: translateY(-2px);
}

.pnl-positive { color: var(--trading-profit); }
.pnl-negative { color: var(--trading-loss); }

.font-mono {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
```

---

**Status:** Ready for Production
**Last Updated:** November 2024
**Compatibility:** All Modern Browsers
**Framework:** Agnostic (Works with React, Vue, Vanilla JS, etc.)

*Use these components to achieve perfect Traderra branding consistency across all platforms.*