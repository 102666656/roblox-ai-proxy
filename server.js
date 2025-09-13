const express = require("express");
const fetch = require("node-fetch");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Stored securely in Railway/Render vars

app.post("/npc-chat", async (req, res) => {
    const { message, memory } = req.body;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [...(memory || []), { role: "user", content: message }],
                temperature: 0.7,
                max_tokens: 150
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI error:", data.error);
            return res.status(500).json({ reply: "Error from OpenAI: " + data.error.message });
        }

        res.json({ reply: data.choices[0].message.content });
    } catch (err) {
        console.error("Proxy error:", err);
        res.status(500).json({ reply: "Error contacting AI." });
    }
});

app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
