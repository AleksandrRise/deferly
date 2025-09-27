import { Email } from './types';

export interface ImportanceFactors {
  urgentKeywords: number;
  hasDeadline: number;
  hasQuestions: number;
  hasNumbersOrDates: number;
  senderWeight: number;
  baseImportance: number;
}

export interface ImportanceResult {
  score: number;
  factors: ImportanceFactors;
  reasoning: string[];
}

const URGENT_KEYWORDS = [
  'eod', 'end of day', 'asap', 'urgent', 'immediately', 'critical',
  'tomorrow', 'today', 'deadline', 'due', 'expires', 'time sensitive',
  'priority', 'rush', 'quick', 'fast', 'soon', 'promptly'
];

const TIME_PATTERNS = [
  /\bby\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
  /\bby\s+\d{1,2}[:\-\s]?\d{0,2}\s?(am|pm)/i,
  /\bby\s+\d{1,2}\/\d{1,2}/i,
  /\bbefore\s+(today|tomorrow)/i,
  /\bdue\s+(today|tomorrow)/i,
  /\bdeadline/i
];

const SENDER_PATTERNS = {
  external: /(@(?!.*\.(com|org|net|edu|gov)$)[^@]+\.[a-z]{2,})/i,
  executive: /(ceo|cto|cfo|vp|vice president|president|director|head of|chief)/i,
  client: /(client|customer|prospect|lead)/i
};

export function calculateImportance(email: Email): ImportanceResult {
  const factors: ImportanceFactors = {
    urgentKeywords: 0,
    hasDeadline: 0,
    hasQuestions: 0,
    hasNumbersOrDates: 0,
    senderWeight: 0,
    baseImportance: email.importance || 0
  };
  
  const reasoning: string[] = [];
  const text = `${email.subject} ${email.preview} ${email.body}`.toLowerCase();
  
  // Check for urgent keywords
  const urgentWords = URGENT_KEYWORDS.filter(keyword => text.includes(keyword.toLowerCase()));
  if (urgentWords.length > 0) {
    factors.urgentKeywords = Math.min(0.3, urgentWords.length * 0.1);
    reasoning.push(`Contains urgent keywords: ${urgentWords.join(', ')}`);
  }
  
  // Check for deadlines
  if (email.deadlineISO) {
    factors.hasDeadline = 0.4;
    reasoning.push('Has explicit deadline');
  } else {
    // Check for time patterns in text
    const timeMatches = TIME_PATTERNS.some(pattern => pattern.test(text));
    if (timeMatches) {
      factors.hasDeadline = 0.3;
      reasoning.push('Contains time-sensitive language');
    }
  }
  
  // Check for questions
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount > 0) {
    factors.hasQuestions = Math.min(0.1, questionCount * 0.05);
    reasoning.push(`Contains ${questionCount} question(s)`);
  }
  
  // Check for numbers and dates
  const hasNumbers = /\d/.test(text);
  const hasDates = /\b\d{1,2}[\/\-]\d{1,2}|\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/.test(text);
  if (hasNumbers || hasDates) {
    factors.hasNumbersOrDates = 0.1;
    reasoning.push('Contains dates or numbers');
  }
  
  // Check sender importance
  const fromField = `${email.from} ${email.name} ${email.company}`.toLowerCase();
  
  if (SENDER_PATTERNS.external.test(email.from)) {
    factors.senderWeight += 0.1;
    reasoning.push('External sender');
  }
  
  if (SENDER_PATTERNS.executive.test(fromField)) {
    factors.senderWeight += 0.15;
    reasoning.push('Executive or leadership role');
  }
  
  if (SENDER_PATTERNS.client.test(fromField)) {
    factors.senderWeight += 0.1;
    reasoning.push('Client or customer');
  }
  
  // Calculate final score
  const score = Math.min(1.0, Math.max(0.0, 
    factors.baseImportance +
    factors.urgentKeywords +
    factors.hasDeadline +
    factors.hasQuestions +
    factors.hasNumbersOrDates +
    factors.senderWeight
  ));
  
  if (reasoning.length === 0) {
    reasoning.push('Standard email priority');
  }
  
  return { score, factors, reasoning };
}

export function sortEmailsByImportance(emails: Email[]): Email[] {
  return emails
    .map(email => ({
      email,
      importance: calculateImportance(email)
    }))
    .sort((a, b) => b.importance.score - a.importance.score)
    .map(item => item.email);
}

export function sortEmailsByRecency(emails: Email[]): Email[] {
  return [...emails].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}