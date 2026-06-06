const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Configure rate limits
const demoSessionLimit = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    limit: 10, // Max 10 requests per IP per 24 hours
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Daily demo limit reached. Please register for an account.' }
});

const demoBurstLimit = rateLimit({
    windowMs: 10 * 1000, // 10 seconds
    limit: 1, // 1 request per 10 seconds
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Please wait a moment before sending another message.' }
});

router.post('/chat', demoBurstLimit, demoSessionLimit, async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: 'Transcript is required' });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a friendly English conversation partner for a Pakistani student. This is a 2-minute demo session. Keep responses SHORT (1-2 sentences max). Be encouraging and natural. Correct mistakes very gently.'
                },
                {
                    role: 'user',
                    content: transcript,
                }
            ],
            model: 'llama-3.3-70b-versatile',
        });

        const reply = chatCompletion.choices[0]?.message?.content || 'I could not process that.';

        res.json({ reply });
    } catch (error) {
        console.error('Groq Demo Route Error:', error);
        res.status(500).json({ error: 'Failed to process request' });
    }
});

module.exports = router;