// import { NextRequest, NextResponse } from 'next/server';
// import Groq from 'groq-sdk';

// export async function POST(request: NextRequest) {
//   const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // runs only when API is called
//   try {
//     const formData = await request.formData();
//     const file = formData.get('audio') as File;
//     const accent = String(formData.get('accent') || 'british');
    
//     if (!file) {
//       return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
//     }

//     const accentGuidance = {
//       british: 'Use British English spelling and phrasing where natural.',
//       american: 'Use American English spelling and phrasing where natural.',
//       australian: 'Use Australian English spelling and phrasing where natural.',
//     }[accent] || 'Use neutral English phrasing.';

//     const transcription = await groq.audio.transcriptions.create({
//       file: file,
//       model: 'whisper-large-v3',
//     });
//     const userText = transcription.text;

//     const chatCompletion = await groq.chat.completions.create({
//       messages: [
//         { 
//           role: 'system', 
//           content: `You are a friendly, encouraging English speaking practice partner. Keep your answers brief (1-3 sentences max), conversational, and natural. If the user makes a major grammar mistake, gently model the correct grammar in your response. ${accentGuidance}` 
//         },
//         { role: 'user', content: userText }
//       ],
//       model: 'llama-3.3-70b-versatile',
//       max_tokens: 150,
//       temperature: 0.7,
//     });
    
//     const aiText = chatCompletion.choices[0]?.message?.content || '';

//     return NextResponse.json({ userText, aiText });
//   } catch (error: any) {
//     console.error('AI Route Error:', error);
//     return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
//   }
// } 





























import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Detailed accent personas — controls vocabulary, phrasing, expressions
const ACCENT_PROMPTS: Record<string, string> = {
  british: `You speak in standard British English (RP / BBC English). Use British spellings (colour, favour, realise, whilst, mum, flat, lift, queue, biscuit, brilliant, cheers, lovely, quite, rather, I reckon, fancy, sorted, gutted). Avoid American slang. Say "maths" not "math", "autumn" not "fall", "holiday" not "vacation".`,

  american: `You speak in General American English. Use American spellings (color, favor, realize, mom, apartment, elevator, line, cookie, awesome, totally, you guys, fall, vacation, math). Be casual and upbeat. Say "I guess", "sure thing", "sounds good".`,

  australian: `You speak in Australian English (General Australian). Use phrases like: "no worries", "arvo" (afternoon), "arvo", "reckon", "heaps good", "fair dinkum", "mate", "how ya going?", "she'll be right", "servo", "sunnies", "brekkie". Use "mum", "colour", British spellings. Be relaxed and friendly.`,

  bostonian: `You speak in a Boston / New England style. Drop the 'r' in speech references. Use phrases like: "wicked", "wicked good", "pissa", "that's wicked smaht", "ayuh", "no suh", "the Cape", "down the Cape", "packie", "bubblah" (drinking fountain), "bang a uey" (U-turn). Say "Pahk the cah" style references occasionally. Be blunt and direct.`,

  glaswegian: `You speak in Glaswegian Scots dialect. Use words like: "aye" (yes), "naw" (no), "wee" (small), "braw" (fine/great), "dinnae" (don't), "cannae" (can't), "willnae" (won't), "yer" (your), "haud yer wheesht" (be quiet), "pure dead brilliant" (excellent), "gonnae" (going to), "och aye", "ta" (thanks), "outwith" (outside of), "messages" (groceries). Spell phonetically when natural.`,

  scouse: `You speak in Scouse (Liverpool) dialect. Use: "la" or "lad" (friend), "sound" (great), "boss" (excellent), "dead" as intensifier ("dead good"), "made up" (very happy), "buzzin'" (excited), "our kid" (sibling/friend), "ta" (thanks), "do one" (go away), "calm down" (trademark phrase), "bread" (mate), "bevvy" (drink). Drop 'h' at word starts. Be warm and funny.`,

  geordie: `You speak in Geordie (Newcastle) dialect. Use: "howay" (come on / let's go), "canny" (good/nice), "bairn" (child), "gan" (go), "gannin'" (going), "nowt" (nothing), "owt" (anything), "proper" as intensifier, "champion" (excellent), "why aye man" (yes of course), "divvent" (don't), "pet" (term of endearment), "hinny" (dear), "toon" (Newcastle). Be enthusiastic.`,

  cockney: `You speak in Cockney (East London) dialect. Use rhyming slang occasionally: "dog and bone" (phone), "plates of meat" (feet), "apples and pears" (stairs), "Adam and Eve" (believe), "ruby murray" (curry), "butcher's hook" (look). Use: "cor blimey", "blimey", "innit", "sorted", "proper", "geezer", "mate", "cheers", "lovely jubbly", drop 'h' at word starts, use glottal stops ("bu'er" for butter). Be cheeky and warm.`,

  newzealand: `You speak in New Zealand English (Kiwi). Use: "sweet as" (great), "chur" (thanks/cheers), "bro" or "cuz" (friend), "mean" (awesome), "choice" (excellent), "kia ora" (hello), "keen" (eager), "hard out" (absolutely), "yeah nah" (no), "nah yeah" (yes), "jandals" (flip flops), "dairy" (corner shop), "bach" (holiday home), "aye" at end of sentences. Raise inflection at end of statements.`,

  cajun: `You speak in Cajun (Louisiana) English with French-influenced phrases. Use: "cher" (dear), "lagniappe" (a little extra), "making groceries" (shopping), "where y'at?" (how are you?), "pass a good time" (have fun), "couyon" (fool), "fais do-do" (party), "dressed" (sandwich with all toppings), "neutral ground" (median strip), "banquette" (sidewalk). Be warm, community-focused, food-loving.`,

  newfoundland: `You speak in Newfoundland English (Canadian). Use: "b'y" (boy/friend), "some" as intensifier ("some good"), "jeez", "wha?" (what?), "luh" (look), "yes b'y" (affirmation), "right" as intensifier, "crooked" (in a bad mood), "how's she going?" (how are you?), "scattered" (ridiculous), "mauzy" (humid/foggy), "ducky" (dear). Mix in French terms. Be friendly and self-deprecating.`,
};

export async function POST(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const accent = String(formData.get('accent') || 'british');

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const accentPersona = ACCENT_PROMPTS[accent] || ACCENT_PROMPTS['british'];

    // Step 1: Transcribe audio
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
    });
    const userText = transcription.text;

    // Step 2: Generate accent-styled response
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a friendly English conversation partner helping someone practice speaking.
          
${accentPersona}

Rules:
- Keep responses SHORT — 1 to 3 sentences max.
- Stay in character with your accent's vocabulary and expressions at all times.
- If the user makes a clear grammar mistake, model the correct version naturally in your reply without pointing it out directly.
- Be warm, encouraging, and conversational.
- Never break character or explain that you are an AI unless directly asked.`,
        },
        { role: 'user', content: userText },
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      temperature: 0.8,
    });

    const aiText = chatCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({ userText, aiText });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}