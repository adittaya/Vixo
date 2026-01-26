
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(__dirname, 'state.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Initialize state from file or defaults
let appState = {
  users: [],
  userProducts: [],
  transactions: [],
  lastWithdrawalTime: {}
};

if (fs.existsSync(STATE_FILE)) {
  try {
    const data = fs.readFileSync(STATE_FILE, 'utf8');
    appState = JSON.parse(data);
    console.log('State loaded from disk');
  } catch (err) {
    console.error('Error loading state:', err);
  }
}

// API Endpoints
app.get('/api/state', (req, res) => {
  res.json(appState);
});

app.post('/api/state', (req, res) => {
  appState = req.body;
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(appState, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving state:', err);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
