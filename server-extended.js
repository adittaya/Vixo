import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import bodyParser from "body-parser";
import fs from "fs";
import path from "path";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;
const STATE_FILE = path.join(process.cwd(), 'state.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(process.cwd()));

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

// Pollinations AI Endpoints
const KEY = 'sk_aRMDlzZq5H1go5NrbWA7rD0c1l95W0Gr'; // Provided API key
const BASE = "https://gen.pollinations.ai";

app.post("/api/ai/text", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const url = `${BASE}/text/${encodeURIComponent(prompt)}?key=${KEY}`;
    const r = await fetch(url);
    const text = await r.text();

    res.json({ text });
  } catch (e) {
    res.status(500).json({ error: "AI busy, try again" });
  }
});

app.post("/api/ai/image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const url = `${BASE}/image/${encodeURIComponent(prompt)}?key=${KEY}`;
    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader("Content-Type", "image/jpeg");
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "AI busy, try again" });
  }
});

// Fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});