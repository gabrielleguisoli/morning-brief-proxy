const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Morning Brief proxy is running ✅" });
});

// Debug route — shows full raw API response
app.post("/api/news", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not set" });
    }

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: req.body.messages
    };

    console.log("Sending to Anthropic:", JSON.stringify(body).substring(0, 200));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14"
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    console.log("Anthropic status:", response.status);
    console.log("Anthropic response:", text.substring(0, 500));

    try {
      const data = JSON.parse(text);
      res.json(data);
    } catch(e) {
      res.status(500).json({ error: "Invalid JSON from Anthropic", raw: text.substring(0, 500) });
    }

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
