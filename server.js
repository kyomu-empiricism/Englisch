require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the local HTML file can communicate with this server
app.use(cors());
// Parse JSON payloads
// We need a larger limit to accept base64 image strings from the frontend cartoon uploader
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the current directory (for CSS, images, etc.)
app.use(express.static(__dirname));

// Serve the english.html file on the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/english.html');
});

// Proxy endpoint for Gemini API
app.post('/api/grade', async (req, res) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
        }

        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Google API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Error proxying to Gemini:', error);
        res.status(500).json({ error: 'Failed to communicate with AI provider.' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ AbiPrep Backend Proxy running strictly on http://localhost:${PORT}`);
    console.log(`🔑 Ensure your GEMINI_API_KEY is set in the .env file.`);
});
