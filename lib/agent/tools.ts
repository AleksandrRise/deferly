import { readFileSync } from 'fs';
import { join } from 'path';
import { computeSuggestions } from '@/lib/engine';
import { createCalendarEvent, snoozeEmail } from '@/lib/composio';
import { generateDraftingPrompt } from '@/lib/summarizer';
import { UserPreferences, Email } from '@/lib/types';

interface ToolFunction {
  name: string;
  description: string;
  execute: (params: Record<string, unknown>) => Promise<unknown>;
}

export function createAgentTools(): ToolFunction[] {
  const getEmailsTool: ToolFunction = {
    name: 'get_emails',
    description: 'Get the current inbox emails to analyze',
    execute: async () => {
      const filePath = join(process.cwd(), 'data', 'emails.json');
      const emails = JSON.parse(readFileSync(filePath, 'utf8'));
      return { emails };
    }
  };

  const getCalendarTool: ToolFunction = {
    name: 'get_calendar',
    description: "Get today's calendar events to find available time slots",
    execute: async () => {
      const filePath = join(process.cwd(), 'data', 'calendar.json');
      const calendar = JSON.parse(readFileSync(filePath, 'utf8'));
      return { calendar };
    }
  };

  const suggestPlanTool: ToolFunction = {
    name: 'suggest_plan',
    description: 'Compute timing suggestions for all emails based on user energy and focus preferences',
    execute: async (params: Record<string, unknown>) => {
      const { userEnergy, focusBlockMins } = params as { userEnergy: number; focusBlockMins: number };
      
      const emailsPath = join(process.cwd(), 'data', 'emails.json');
      const calendarPath = join(process.cwd(), 'data', 'calendar.json');
      
      const emails = JSON.parse(readFileSync(emailsPath, 'utf8'));
      const calendar = JSON.parse(readFileSync(calendarPath, 'utf8'));
      
      const preferences: UserPreferences = {
        energy: userEnergy || 4,
        focusBlockMins: focusBlockMins || 30,
        workingHours: {
          start: 9,
          end: 18,
          lunchStart: 12,
          lunchEnd: 13
        },
        timezone: 'America/Los_Angeles'
      };
      
      const suggestions = computeSuggestions(emails, calendar, preferences);
      return { suggestions };
    }
  };

  const createCalendarBlockTool: ToolFunction = {
    name: 'create_calendar_block',
    description: 'Create a calendar block for focused email work',
    execute: async (params: Record<string, unknown>) => {
      const { title, startISO, endISO, description } = params as { 
        title: string; 
        startISO: string; 
        endISO: string; 
        description?: string 
      };
      
      const result = await createCalendarEvent({
        title,
        startISO,
        endISO,
        description
      });
      
      return { 
        success: true, 
        event: result,
        message: `Created calendar block: ${title} from ${new Date(startISO).toLocaleTimeString()} to ${new Date(endISO).toLocaleTimeString()}`
      };
    }
  };

  const snoozeEmailTool: ToolFunction = {
    name: 'snooze_email',
    description: 'Snooze an email until a specific time',
    execute: async (params: Record<string, unknown>) => {
      const { emailId, untilISO } = params as { emailId: string; untilISO: string };
      
      const result = await snoozeEmail({ emailId, untilISO });
      
      return {
        success: true,
        snooze: result,
        message: `Snoozed email ${emailId} until ${new Date(untilISO).toLocaleString()}`
      };
    }
  };

  const genDraftingPromptTool: ToolFunction = {
    name: 'gen_drafting_prompt',
    description: 'Generate a drafting prompt for an email based on timing strategy',
    execute: async (params: Record<string, unknown>) => {
      const { emailId, suggestion } = params as { emailId: string; suggestion: Record<string, unknown> };
      
      const emailsPath = join(process.cwd(), 'data', 'emails.json');
      const emails: Email[] = JSON.parse(readFileSync(emailsPath, 'utf8'));
      
      const email = emails.find(e => e.id === emailId);
      if (!email) {
        throw new Error(`Email ${emailId} not found`);
      }
      
      const prompt = generateDraftingPrompt(email, suggestion);
      
      return {
        emailId,
        draftingPrompt: prompt,
        message: `Generated drafting prompt for email from ${email.name}`
      };
    }
  };

  return [
    getEmailsTool,
    getCalendarTool,
    suggestPlanTool,
    createCalendarBlockTool,
    snoozeEmailTool,
    genDraftingPromptTool
  ];
}