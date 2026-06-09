import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY }); // runs only when API is called
  try {
    const formData = await request.formData();
    const file = formData.get('audio') as File;
    const accent = String(formData.get('accent') || 'british');
    
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const accentGuidance = {
      british: 'Use British English spelling and phrasing where natural.',
      american: 'Use American English spelling and phrasing where natural.',
      australian: 'Use Australian English spelling and phrasing where natural.',
    }[accent] || 'Use neutral English phrasing.';

    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: 'whisper-large-v3',
    });
    const userText = transcription.text;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are a friendly, encouraging English speaking practice partner. Keep your answers brief (1-3 sentences max), conversational, and natural. If the user makes a major grammar mistake, gently model the correct grammar in your response. ${accentGuidance}` 
        },
        { role: 'user', content: userText }
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 150,
      temperature: 0.7,
    });
    
    const aiText = chatCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({ userText, aiText });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
} 

