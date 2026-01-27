import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import "dotenv/config";

const app = express();
app.use(cors());
app.use(express.json());

const KEY = process.env.POLLINATIONS_API_KEY;
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

app.listen(process.env.PORT, () =>
  console.log(`AI server running on :${process.env.PORT}`)
);