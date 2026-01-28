import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const POLLINATIONS_API_KEY = process.env.POLLINATIONS_API_KEY;
const BASE = "https://gen.pollinations.ai";

app.post("/api/ai/text", async (req, res) => {
  try {
    const { prompt, messages, model, temperature, presence_penalty, frequency_penalty, max_tokens } = req.body;

    // If messages are provided (chat format), use the chat completions endpoint
    if (messages && Array.isArray(messages)) {
      const requestBody = {
        model: model || "openai",
        temperature: temperature !== undefined ? temperature : 0.2,
        presence_penalty: presence_penalty !== undefined ? presence_penalty : 0.6,
        frequency_penalty: frequency_penalty !== undefined ? frequency_penalty : 0.6,
        max_tokens: max_tokens || 500,
        messages: messages
      };

      const url = `${BASE}/v1/chat/completions`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${POLLINATIONS_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!r.ok) {
        throw new Error(`API responded with status ${r.status}`);
      }

      const data = await r.json();
      res.json({ text: data.choices[0].message.content });
    } else {
      // Fallback to simple text endpoint if only prompt is provided
      if (!prompt) return res.status(400).json({ error: "prompt or messages required" });

      const encodedPrompt = encodeURIComponent(prompt);
      const url = `${BASE}/text/${encodedPrompt}?key=${POLLINATIONS_API_KEY}`;
      const r = await fetch(url);
      const text = await r.text();

      res.json({ text });
    }
  } catch (e) {
    console.error("API error:", e);
    res.status(500).json({ error: "AI busy, try again" });
  }
});

app.post("/api/ai/image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const url = `${BASE}/image/${encodeURIComponent(prompt)}?key=${POLLINATIONS_API_KEY}`;
    const r = await fetch(url);
    const buf = Buffer.from(await r.arrayBuffer());

    res.setHeader("Content-Type", "image/jpeg");
    res.send(buf);
  } catch (e) {
    res.status(500).json({ error: "AI busy, try again" });
  }
});

app.listen(process.env.PORT || 3001, () =>
  console.log(`AI server running on :${process.env.PORT || 3001}`)
);