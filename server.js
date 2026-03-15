const express = require("express");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (req, res) => {
  res.json({ status: "Morning Brief proxy is running ✅" });
});

app.post("/api/news", async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "ANTHROPIC_API_KEY not set", debug: "No API key found in environment" });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: req.body.messages
      })
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text.substring(0, 1000));

    const data = JSON.parse(text);

    // If there's an API error, pass it through visibly
    if (data.error) {
      return res.status(200).json({ 
        error: data.error.message, 
        errorType: data.error.type,
        content: [] 
      });
    }

    res.json(data);

  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.message, content: [] });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
