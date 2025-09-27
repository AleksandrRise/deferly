import { NextRequest, NextResponse } from 'next/server';
import { EmailPlannerAgent } from '@/lib/agent/planner';

let agent: EmailPlannerAgent | null = null;

function getAgent(): EmailPlannerAgent {
  if (!agent) {
    agent = new EmailPlannerAgent();
  }
  return agent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, approve = false } = body;
    
    if (!message && !approve) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const agentInstance = getAgent();
    const response = await agentInstance.planEmailReplies(message || '', approve);
    
    return NextResponse.json({ 
      response,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Agent API error:', error);
    
    // Return a fallback response
    return NextResponse.json({
      response: "I'm having trouble connecting to the planning system. Here's a basic analysis of your emails:\n\n• **High priority**: Review Priya's proposal (deadline tomorrow)\n• **Medium priority**: Schedule call with Jordan (can wait until next week)\n• **Low priority**: Acknowledge IT notice (FYI only)\n\nWould you like me to suggest specific times for these?",
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
}

// Optional: Reset endpoint for development
export async function DELETE() {
  if (agent) {
    await agent.reset();
  }
  return NextResponse.json({ message: 'Agent reset' });
}