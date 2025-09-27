import { Email } from './types';

export function generateDraftingPrompt(email: Email, suggestion: Record<string, unknown>): string {
  const goalGuess = inferGoal(email);
  const constraints = extractConstraints(email);
  
  return `You are my email drafting assistant. Draft a concise reply (≤120 words) in my tone: brief, polite, actionable.

Context:
- Sender: ${email.name} (${email.company})
- Subject: ${email.subject}
- Summary of email: ${summarizeEmail(email)}
- My goal: ${goalGuess}
- Constraints: ${constraints}
- Deferral plan: I intend to reply at ${suggestion.suggestedTimeISO ? new Date(suggestion.suggestedTimeISO as string).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }) : 'now'} because ${suggestion.reason as string}.

Instructions:
- Start with a clear answer or next step.
- Offer 2 time options if scheduling is needed.
- Avoid apologies and hedging.`;
}

function summarizeEmail(email: Email): string {
  // Simple extractive summarization
  const sentences = email.body.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length <= 2) {
    return email.body.replace(/\n+/g, ' ').trim();
  }
  
  // Return first and most important sentence
  const firstSentence = sentences[0].trim();
  const importantSentence = sentences.find(s => 
    s.toLowerCase().includes('need') || 
    s.toLowerCase().includes('request') ||
    s.toLowerCase().includes('could you') ||
    s.toLowerCase().includes('deadline') ||
    s.toLowerCase().includes('urgent')
  );
  
  if (importantSentence && importantSentence !== firstSentence) {
    return `${firstSentence}. ${importantSentence.trim()}.`;
  }
  
  return `${firstSentence}.`;
}

function inferGoal(email: Email): string {
  const body = email.body.toLowerCase();
  const subject = email.subject.toLowerCase();
  
  if (body.includes('feedback') || body.includes('review')) {
    return 'Provide thoughtful feedback';
  }
  
  if (body.includes('meeting') || body.includes('call') || body.includes('schedule')) {
    return 'Schedule a meeting';
  }
  
  if (body.includes('proposal') || body.includes('attached')) {
    return 'Review attached materials';
  }
  
  if (subject.includes('fyi') || body.includes('inform') || body.includes('update')) {
    return 'Acknowledge receipt';
  }
  
  if (body.includes('question') || body.includes('help') || body.includes('advice')) {
    return 'Provide helpful information';
  }
  
  return 'Respond appropriately';
}

function extractConstraints(email: Email): string {
  const constraints: string[] = [];
  
  if (email.deadlineISO) {
    const deadline = new Date(email.deadlineISO);
    constraints.push(`Deadline: ${deadline.toLocaleDateString()} at ${deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  }
  
  if (email.estimatedMinutes > 30) {
    constraints.push(`Estimated effort: ${email.estimatedMinutes} minutes`);
  }
  
  if (email.hasAttachment) {
    constraints.push('Has attachment to review');
  }
  
  if (email.tags.includes('urgent')) {
    constraints.push('Marked as urgent');
  }
  
  return constraints.length > 0 ? constraints.join(', ') : 'None specified';
}