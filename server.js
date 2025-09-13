require('dotenv').config(); // Load environment variables
const express = require("express");
const fetch = require("node-fetch"); // v2 for CommonJS
const app = express();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.warn("⚠️ WARNING: OPENAI_API_KEY is not set. Requests will fail until configured.");
}

app.use(express.json());

// Trim newlines from URL to prevent %0A
app.use((req, res, next) => {
    req.url = req.url.replace(/[\r\n]+/g, "");
    next();
});

// GET / for testing
app.get("/", (req, res) => {
    res.send("✅ Proxy running. POST to /npc-chat with JSON { message, memory }.");
});

// POST /npc-chat
app.post("/npc-chat", async (req, res) => {
    const { message, memory } = req.body;

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message must be a string." });
    }

    const memoryArr = Array.isArray(memory) ? memory : [];
    const messages = [...memoryArr, { role: "user", content: message }];

    console.log("Received message:", message);

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ reply: "OpenAI API key not set." });
    }

    try {
        const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const text = await apiResponse.text();
        if (!apiResponse.ok) {
            return res.status(500).json({ reply: "OpenAI error", details: text });
        }

        const data = JSON.parse(text);
        const reply = data.choices?.[0]?.message?.content || "No reply from AI";

        res.json({ reply });
    } catch (err) {
        console.error("Exception contacting OpenAI:", err);
        res.status(500).json({ reply: "Exception contacting AI", error: err.toString() });
    }
});

// Catch-all
app.all("*", (req, res) => {
    res.status(404).send(`Route not found: ${req.originalUrl}`);
});

// Start server
app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
