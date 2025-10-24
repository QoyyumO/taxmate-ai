import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Groq API...');
    
    // Check if API key is available
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Groq API key not configured',
          details: 'Please add GROQ_API_KEY to your environment variables'
        },
        { status: 500 }
      );
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY!,
    });

    // Test with a simple prompt
    const prompt = 'Hello, can you respond with "Groq API is working" if you can read this?';
    
    console.log('Sending test prompt to Groq...');
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.1,
      max_tokens: 100,
    });
    
    const response = completion.choices[0]?.message?.content;
    
    console.log('Groq response:', response);

    return NextResponse.json({
      success: true,
      message: 'Groq API is working',
      response: response,
      apiKey: process.env.GROQ_API_KEY ? 'Configured' : 'Not configured'
    });

  } catch (error) {
    console.error('Groq API test failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Groq API test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        apiKey: process.env.GROQ_API_KEY ? 'Configured' : 'Not configured'
      },
      { status: 500 }
    );
  }
}
