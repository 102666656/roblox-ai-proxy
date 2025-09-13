const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is not set in environment variables.");
    // Instead of exiting, we keep the server running to debug
}

app.use(express.json());

// GET route for testing
app.get("/", (req, res) => {
    res.send("Proxy server is running. POST to /npc-chat with JSON { message, memory }.");
});

// POST /npc-chat route
app.post("/npc-chat", async (req, res) => {
    const { message, memory } = req.body;

    if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Invalid request: message must be a string." });
    }

    const memoryArr = Array.isArray(memory) ? memory : [];
    const messages = [...memoryArr, { role: "user", content: message }];

    console.log("Received message:", message);
    console.log("Memory:", memoryArr);

    if (!OPENAI_API_KEY) {
        return res.status(500).json({ reply: "OpenAI API key is not set on server." });
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
                messages: messages,
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const responseText = await apiResponse.text();
        console.log("OpenAI raw response:", responseText);

        if (!apiResponse.ok) {
            return res.status(500).json({ reply: "OpenAI API returned error.", details: responseText });
        }

        const data = JSON.parse(responseText);
        const reply = data.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({ reply: "No reply from OpenAI.", details: responseText });
        }

        res.json({ reply });

    } catch (err) {
        console.error("Exception contacting OpenAI:", err);
        res.status(500).json({ reply: "Exception contacting AI.", error: err.toString() });
    }
});

// Catch-all route
app.all("*", (req, res) => {
    res.status(404).send(`Route not found: ${req.originalUrl}`);
});

app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));

