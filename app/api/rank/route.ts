import { NextRequest, NextResponse } from 'next/server';
import { Email } from '@/lib/types';
import { sortEmailsByImportance } from '@/lib/importance';

export async function POST(request: NextRequest) {
  try {
    const { emails } = await request.json();
    
    if (!emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'Emails array is required' },
        { status: 400 }
      );
    }

    // Check if we have an OpenAI API key for LLM ranking
    const hasOpenAIKey = process.env.OPENAI_API_KEY;
    
    if (hasOpenAIKey) {
      // Use LLM-based ranking
      try {
        const rankedEmails = await rankEmailsWithLLM(emails);
        return NextResponse.json({ emails: rankedEmails, method: 'llm' });
      } catch (error) {
        console.error('LLM ranking failed, falling back to heuristic:', error);
        // Fall through to heuristic ranking
      }
    }
    
    // Use heuristic ranking as fallback
    const rankedEmails = sortEmailsByImportance(emails);
    return NextResponse.json({ emails: rankedEmails, method: 'heuristic' });
    
  } catch (error) {
    console.error('Ranking error:', error);
    return NextResponse.json(
      { error: 'Failed to rank emails' },
      { status: 500 }
    );
  }
}

async function rankEmailsWithLLM(emails: Email[]): Promise<Email[]> {
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
        content: `Rank these emails by importance (1.0 = most important, 0.0 = least important). Consider urgency, deadlines, sender authority, and business impact.

Return a JSON array with objects containing "id" and "importance" fields.

Emails:
${emails.map((email, i) => `${i + 1}. ID: ${email.id}
From: ${email.name} <${email.from}> (${email.company})
Subject: ${email.subject}
Preview: ${email.preview}
Deadline: ${email.deadlineISO || 'None'}
---`).join('\n')}

Response format:
[{"id": "email_id", "importance": 0.95}, ...]`
      }],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const rankings = JSON.parse(data.choices[0].message.content);
  
  // Apply LLM rankings to emails
  const rankingMap = new Map(rankings.map((r: { id: string; importance: number }) => [r.id, r.importance]));
  
  return emails
    .map(email => ({
      ...email,
      importance: rankingMap.get(email.id) || email.importance || 0
    } as Email))
    .sort((a, b) => b.importance - a.importance);
}