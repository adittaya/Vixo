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
    const { prompt, messages, model, temperature, presence_penalty, frequency_penalty, max_tokens } = req.body;

    // Debug logging
    console.log('Received request body:', req.body);
    console.log('Messages:', messages);
    console.log('Messages type:', typeof messages);
    console.log('Is array?', Array.isArray(messages));

    // If messages are provided (chat format), use the chat completions endpoint
    // Using a more robust check for array
    if (messages && Array.isArray(messages)) {
      console.log('Processing as chat format');
      // Add system message to ensure proper response from reasoning models
      const systemMessage = {
        role: "system",
        content: "You are a professional customer support AI. Always reply with clear, helpful text. Never return an empty response."
      };

      const messagesWithSystem = [systemMessage, ...messages];

      const requestBody = {
        model: model || "openai",
        temperature: temperature !== undefined ? temperature : 0.2,
        max_tokens: max_tokens || 300, // Reduced to prevent full reasoning consumption
        messages: messagesWithSystem
      };

      const url = `${BASE}/v1/chat/completions?key=${KEY}`;
      console.log('Making request to:', url);
      console.log('Request body:', requestBody);

      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', r.status);
      console.log('Response OK:', r.ok);

      if (!r.ok) {
        const errorText = await r.text();
        console.error('API error response:', errorText);
        throw new Error(`API responded with status ${r.status}: ${errorText}`);
      }

      const data = await r.json();
      console.log('Response data received:', JSON.stringify(data, null, 2));

      // Properly extract response text from the API response
      let responseText = '';

      if (data.choices && data.choices[0]) {
        const firstChoice = data.choices[0];

        if (firstChoice.message && typeof firstChoice.message.content === 'string') {
          responseText = firstChoice.message.content;
        }
        // Some APIs might have the content in a different structure
        else if (firstChoice.delta && typeof firstChoice.delta.content === 'string') {
          responseText = firstChoice.delta.content;
        }
        else if (firstChoice.text && typeof firstChoice.text === 'string') {
          responseText = firstChoice.text;
        }
      }

      // FINAL SAFETY NET - if response is empty, provide a default response
      if (!responseText || !responseText.trim()) {
        console.log('Empty response detected, providing default response');
        responseText = "I understand you need assistance. Our support team has received your request and will assist you shortly. For password-related issues, please follow the standard procedure in the app or contact admin directly.";
      }

      res.json({ text: responseText });
    } else {
      // Fallback to simple text endpoint if only prompt is provided
      if (!prompt) return res.status(400).json({ error: "prompt or messages required" });

      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${BASE}/text/${encodedPrompt}?key=${KEY}`;
      const r = await fetch(url);
      const text = await r.text();

      res.json({ text });
    }
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