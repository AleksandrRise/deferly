import { NextRequest, NextResponse } from 'next/server';
import { Email } from '@/lib/types';
import { calculateImportance } from '@/lib/importance';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if we have an OpenAI API key for LLM summarization
    const hasOpenAIKey = process.env.OPENAI_API_KEY;
    
    if (hasOpenAIKey) {
      try {
        const llmSummary = await generateLLMSummary(email);
        return NextResponse.json({ summary: llmSummary, method: 'llm' });
      } catch (error) {
        console.error('LLM summarization failed, falling back to heuristic:', error);
        // Fall through to heuristic summary
      }
    }
    
    // Use heuristic summary as fallback
    const heuristicSummary = generateHeuristicSummary(email);
    return NextResponse.json({ summary: heuristicSummary, method: 'heuristic' });
    
  } catch (error) {
    console.error('Summarization error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}

async function generateLLMSummary(email: Email): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Summarize this email in 1-2 sentences focusing on the key request, urgency, and estimated time needed:

From: ${email.name} <${email.from}>
Subject: ${email.subject}
Content: ${email.body}
Deadline: ${email.deadlineISO || 'None specified'}

Keep it brief and actionable.`
      }],
      temperature: 0.3,
      max_tokens: 150
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

function generateHeuristicSummary(email: Email): string {
  const importance = calculateImportance(email);
  const urgencyLevel = importance.score >= 0.8 ? 'high' : 
                      importance.score >= 0.6 ? 'medium' : 'low';
  
  const keyFactors = importance.reasoning.slice(0, 2); // Top 2 factors
  const estimatedTime = email.estimatedMinutes || 30;
  
  let summary = `Email from ${email.name} about ${email.subject.toLowerCase()}. `;
  
  if (email.deadlineISO) {
    const deadline = new Date(email.deadlineISO);
    const timeUntil = Math.round((deadline.getTime() - Date.now()) / (1000 * 60 * 60));
    summary += `Deadline in ${timeUntil} hours. `;
  }
  
  summary += `${urgencyLevel.charAt(0).toUpperCase() + urgencyLevel.slice(1)} priority`;
  
  if (keyFactors.length > 0) {
    summary += ` (${keyFactors.join(', ').toLowerCase()})`;
  }
  
  summary += `. Estimated ${estimatedTime} minutes to handle.`;
  
  return summary;
}