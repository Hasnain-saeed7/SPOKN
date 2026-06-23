// const express = require('express');
// const router = express.Router();
// const rateLimit = require('express-rate-limit');
// const Groq = require('groq-sdk');

// const groq = new Groq({
//     apiKey: process.env.GROQ_API_KEY
// });

// // Configure rate limits
// const demoSessionLimit = rateLimit({
//     windowMs: 24 * 60 * 60 * 1000, // 24 hours
//     limit: 10, // Max 10 requests per IP per 24 hours
//     standardHeaders: 'draft-7',
//     legacyHeaders: false,
//     message: { error: 'Daily demo limit reached. Please register for an account.' }
// });

// const demoBurstLimit = rateLimit({
//     windowMs: 10 * 1000, // 10 seconds
//     limit: 1, // 1 request per 10 seconds
//     standardHeaders: 'draft-7',
//     legacyHeaders: false,
//     message: { error: 'Please wait a moment before sending another message.' }
// });

// router.post('/chat', demoBurstLimit, demoSessionLimit, async (req, res) => {
//     try {
//         const { transcript } = req.body;

//         if (!transcript) {
//             return res.status(400).json({ error: 'Transcript is required' });
//         }

//         const chatCompletion = await groq.chat.completions.create({
//             messages: [
//                 {
//                     role: 'system',
//                     content: 'You are a friendly English conversation partner for a Pakistani student. This is a 2-minute demo session. Keep responses SHORT (1-2 sentences max). Be encouraging and natural. Correct mistakes very gently.'
//                 },
//                 {
//                     role: 'user',
//                     content: transcript,
//                 }
//             ],
//             model: 'llama-3.3-70b-versatile',
//         });

//         const reply = chatCompletion.choices[0]?.message?.content || 'I could not process that.';

//         res.json({ reply });
//     } catch (error) {
//         console.error('Groq Demo Route Error:', error);
//         res.status(500).json({ error: 'Failed to process request' });
//     }
// });

// module.exports = router;















const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Accent personas — mirrors the frontend route for consistency
const ACCENT_PROMPTS = {
  british:      `Use British English spelling and expressions: colour, favour, realise, whilst, brilliant, cheers, lovely, mum, flat, lift, queue, biscuit, "I reckon", "fancy", "sorted", "gutted". Say "maths" not "math", "autumn" not "fall".`,
  american:     `Use American English: color, favor, realize, awesome, totally, you guys, fall, vacation, math, mom, apartment, elevator. Be upbeat and casual.`,
  australian:   `Use Australian English: "no worries", "arvo", "reckon", "heaps good", "fair dinkum", "mate", "she'll be right", "brekkie", "sunnies". Spell British style. Be relaxed.`,
  bostonian:    `Use Boston/New England style: "wicked", "wicked good", "pissa", "wicked smaht", "bang a uey". Be blunt and direct.`,
  glaswegian:   `Use Glaswegian Scots: "aye", "naw", "wee", "braw", "dinnae", "cannae", "willnae", "yer", "pure dead brilliant", "gonnae", "och aye", "ta", "outwith". Warm but direct.`,
  scouse:       `Use Scouse (Liverpool): "la", "lad", "sound", "boss", "dead good", "made up", "buzzin'", "our kid", "ta", "bevvy". Be warm and funny.`,
  geordie:      `Use Geordie (Newcastle): "howay", "canny", "bairn", "gan", "gannin'", "nowt", "owt", "champion", "why aye man", "divvent", "pet", "hinny", "toon". Be enthusiastic.`,
  cockney:      `Use Cockney (East London): "cor blimey", "blimey", "innit", "sorted", "proper", "geezer", "cheers", "lovely jubbly". Occasional rhyming slang: "dog and bone" (phone), "apples and pears" (stairs). Be cheeky and warm.`,
  newzealand:   `Use NZ English: "sweet as", "chur", "bro", "cuz", "mean", "choice", "kia ora", "keen", "hard out", "yeah nah", "nah yeah", "jandals", "dairy", "bach", "aye". Raise inflection at end of statements.`,
  cajun:        `Use Cajun (Louisiana): "cher", "lagniappe", "making groceries", "where y'at?", "pass a good time", "fais do-do". Be warm, community-focused, food-loving.`,
  newfoundland: `Use Newfoundland English: "b'y", "some good", "jeez", "wha?", "luh", "yes b'y", "crooked", "how's she going?", "scattered", "mauzy", "ducky". Be friendly and self-deprecating.`,
};

const demoSessionLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Daily demo limit reached. Please register for an account.' }
});

const demoBurstLimit = rateLimit({
  windowMs: 10 * 1000,
  limit: 1,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Please wait a moment before sending another message.' }
});

router.post('/chat', demoBurstLimit, demoSessionLimit, async (req, res) => {
  try {
    const { transcript, accent = 'british' } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: 'Transcript is required' });
    }

    const accentPersona = ACCENT_PROMPTS[accent] || ACCENT_PROMPTS['british'];

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a friendly English conversation partner for a language learner. This is a 2-minute demo session.

${accentPersona}

Keep responses SHORT (1-2 sentences max). Be encouraging and natural. Correct mistakes very gently by modelling the correct form in your reply, never by pointing it out directly. Stay in character with your accent at all times.`
        },
        {
          role: 'user',
          content: transcript,
        }
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 120,
      temperature: 0.8,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'I could not process that.';
    res.json({ reply });
  } catch (error) {
    console.error('Groq Demo Route Error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

module.exports = router;










