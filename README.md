# Deferly - Reply at the right time

**60-second pitch for judges:**
Deferly is a full-stack agent that protects focus by deciding when to reply to emails. It uses LlamaIndex for reasoning, Composio tools to take real actions, and CopilotKit/AG-UI for an agentic UI. Instead of writing emails for you, it strategically schedules when you should write them based on urgency, deadlines, and your energy patterns.

## Demo Script (3 minutes)

1. **Show the problem** (30s)
   - Open inbox with 3 emails of varying urgency
   - Point out competing priorities and deadlines
   - "Without strategy, we either stress-reply immediately or forget important deadlines"

2. **Agent planning** (90s)
   - Chat: "Plan my replies today at energy 4 and 30-min focus blocks"
   - Agent analyzes emails + calendar, proposes specific times with reasoning
   - Show confidence scores and explanations
   - Click "👍 Approve Plan" 

3. **Canvas sync** (60s)
   - Calendar shows new suggestion blocks
   - Inbox chips update with colors (Green=Now, Blue=Today, Purple=Tomorrow, Orange=Block)
   - Click an email → shows drafting prompt (not auto-written content)
   - Copy prompt → paste into email client

**Key differentiator:** "We don't write your emails—we optimize when you write them."

## Quick Start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Visit http://localhost:3000

## How to Enable Live Tools with Composio

1. Sign up at [composio.dev](https://composio.dev)
2. Get your API key from the dashboard
3. Add to `.env.local`:
   ```
   COMPOSIO_API_KEY=your_key_here
   COMPOSIO_PROVIDER=google  # or microsoft
   ```
4. Follow Composio's auth flow to connect Gmail/Outlook
5. Restart the app - real calendar blocks and email snoozing will work

Without these keys, the app uses mock mode (perfect for demos).

## Architecture

- **Frontend:** Next.js 14 + Tailwind CSS with CopilotKit chat UI
- **Agent:** LlamaIndex with function tools (falls back to heuristics)
- **Tools:** Composio SDK for calendar/email actions (with mock fallback)
- **Engine:** Deterministic scheduling logic considering urgency, deadlines, energy patterns

## Features

✅ **Smart timing:** Analyzes urgency = 0.4×importance + 0.4×deadline + 0.2×complexity  
✅ **Energy awareness:** Prefers morning slots for high-energy users  
✅ **Focus protection:** Books dedicated time blocks for complex emails  
✅ **Calendar integration:** Creates non-overlapping suggestion blocks  
✅ **Drafting assistance:** Generates context-aware prompts (doesn't write emails)  
✅ **Mock mode:** Works without API keys for demos  

## Next Steps

- **Real data:** Swap mocks for Microsoft Graph/Gmail via Composio
- **Export:** Add .ics calendar export for external apps
- **Mobile:** Outlook/Gmail add-in for mobile workflows
- **Smart defaults:** Learn user patterns to improve suggestions
- **Team mode:** Coordinate reply timing across team calendars

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## Environment Variables

See `.env.local.example` for all configuration options.

---

Built with ❤️ for focused productivity. [Report issues](https://github.com/anthropics/claude-code/issues)
