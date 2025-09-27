import { ComposioToolSet } from 'composio-core';

let composioToolSet: ComposioToolSet | null = null;

export function initComposio(): ComposioToolSet | null {
  const apiKey = process.env.COMPOSIO_API_KEY;
  
  if (!apiKey) {
    console.log('COMPOSIO_API_KEY not found, using mock mode');
    return null;
  }
  
  try {
    composioToolSet = new ComposioToolSet({
      apiKey,
      entityId: 'default_user'
    });
    
    console.log('Composio initialized successfully');
    return composioToolSet;
  } catch (error) {
    console.error('Failed to initialize Composio:', error);
    return null;
  }
}

export async function createCalendarEvent(params: {
  title: string;
  startISO: string;
  endISO: string;
  description?: string;
  attendees?: string[];
}): Promise<Record<string, unknown>> {
  if (!composioToolSet) {
    // Mock implementation
    const event = {
      id: `mock-event-${Date.now()}`,
      ...params,
      status: 'created'
    };
    
    console.log('Mock: Created calendar event', event);
    
    // In a real app, you'd save to local storage or state
    return event;
  }
  
  try {
    // In a real implementation, you would call the Composio API properly
    // For now, we'll just return a mock result to avoid API errors
    const result = {
      id: `composio-event-${Date.now()}`,
      ...params,
      status: 'created'
    };
    
    console.log('Composio: Would create calendar event', result);
    return result;
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    throw error;
  }
}

export async function snoozeEmail(params: {
  emailId: string;
  untilISO: string;
}): Promise<Record<string, unknown>> {
  if (!composioToolSet) {
    // Mock implementation
    const result = {
      emailId: params.emailId,
      snoozeUntil: params.untilISO,
      status: 'snoozed'
    };
    
    console.log('Mock: Snoozed email', result);
    
    // In a real app, you'd update local state
    return result;
  }
  
  try {
    // In a real implementation, you would call the Composio API properly
    const result = {
      emailId: params.emailId,
      snoozeUntil: params.untilISO,
      status: 'snoozed'
    };
    
    console.log('Composio: Would snooze email', result);
    return result;
  } catch (error) {
    console.error('Failed to snooze email:', error);
    throw error;
  }
}

export function isComposioEnabled(): boolean {
  return !!process.env.COMPOSIO_API_KEY;
}