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
    const { message, email, context, approve = false } = body;
    
    if (!message && !approve) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }
    
    const agentInstance = getAgent();
    
    // If we have email context, use it for better responses
    if (email && context) {
      const response = await agentInstance.planEmailReplies(
        message || '', 
        approve, 
        email, 
        context.messages || []
      );
      
      return NextResponse.json({ 
        response,
        timestamp: new Date().toISOString(),
        actions: response.actions || []
      });
    } else {
      // Fallback for simple messages
      const response = await agentInstance.planEmailReplies(message || '', approve);
      
      return NextResponse.json({ 
        response,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Agent API error:', error);
    
    // Return a contextual fallback response
    const fallbackResponse = email 
      ? `I can help you with "${email.subject}". Here are some suggestions:\n\n• **Quick reply**: I can draft a response for you\n• **Schedule time**: Find the best time to handle this email\n• **Defer**: Move this to a better time slot\n• **Priority check**: Assess if this needs immediate attention\n\nWhat would you like to do with this email?`
      : "I'm having trouble connecting to the planning system. Here's a basic analysis of your emails:\n\n• **High priority**: Review urgent items with deadlines\n• **Medium priority**: Schedule calls and meetings\n• **Low priority**: Acknowledge notifications and updates\n\nWould you like me to suggest specific times for these?";
    
    return NextResponse.json({
      response: fallbackResponse,
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
