const express = require("express");
const fetch = require("node-fetch");
const app = express();

const PORT = process.env.PORT || 8080;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY is not set in environment variables.");
    process.exit(1);
}

app.use(express.json());

// Optional GET route for testing in browser
app.get("/", (req, res) => {
    res.send("Proxy server is running. POST to /npc-chat to talk to AI.");
});

// Main AI endpoint
app.post("/npc-chat", async (req, res) => {
    const { message, memory } = req.body;

    if (typeof message !== "string") {
        return res.status(400).json({ error: "Invalid request: message must be string." });
    }

    const memoryArr = Array.isArray(memory) ? memory : [];
    const messages = [...memoryArr, { role: "user", content: message }];

    console.log("Received message:", message);
    console.log("Memory:", memoryArr);

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
        const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;

        if (!reply) {
            return res.status(500).json({ reply: "No reply from OpenAI.", details: responseText });
        }

        return res.json({ reply: reply });

    } catch (err) {
        console.error("Exception contacting OpenAI:", err);
        return res.status(500).json({ reply: "Exception contacting AI.", error: err.toString() });
    }
});

app.listen(PORT, () => console.log(`✅ Proxy server running on port ${PORT}`));
