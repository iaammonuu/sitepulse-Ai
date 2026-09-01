import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize Gemini SDK, falling back to simulated engine:', e);
      aiClient = null;
    }
  }
  return aiClient;
}

export async function parseDocumentWithGemini(filename: string, content: string): Promise<{
  extractedEvents: Array<{
    activityName: string;
    eventType: string;
    quantity: number;
    unit: string;
    area: string;
    discipline: string;
    confidence: number;
    evidence: string;
  }>;
  isSimulated: boolean;
}> {
  const genAI = getGenAI();
  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `You are SitePulse AI, an autonomous construction execution intelligence engine.
Analyze the following construction report text from file "${filename}":
\`\`\`
${content}
\`\`\`
Extract all construction execution events with structured attributes:
- activityName (e.g. Spool Erection, Field Welding Line 24)
- eventType (ACTIVITY_STARTED, ACTIVITY_IN_PROGRESS, ACTIVITY_COMPLETED, MATERIAL_DELAY)
- quantity (number)
- unit (NOS, JOINT, M3, MTR, %, etc.)
- area (e.g. Area A, Area B, Substation A)
- discipline (CIVIL, PIPING, STATIC_EQUIPMENT, ROTATING_EQUIPMENT, ELECTRICAL, INSTRUMENTATION, HSE)
- confidence (number between 0.70 and 0.99)
- evidence (verbatim snippet from text)

Return valid JSON as an array of objects.`;

      const response = await genAI.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json'
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed)) {
          return { extractedEvents: parsed, isSimulated: false };
        }
      }
    } catch (err) {
      console.warn('Gemini API call failed, using deterministic simulation:', err);
    }
  }

  // Deterministic fallback / demo simulation
  const lower = (filename + ' ' + content).toLowerCase();
  const events = [];

  if (lower.includes('spool') || lower.includes('piping')) {
    events.push({
      activityName: 'Spool Erection',
      eventType: 'ACTIVITY_COMPLETED',
      quantity: 18,
      unit: 'NOS',
      area: 'Area A',
      discipline: 'PIPING',
      confidence: 0.93,
      evidence: 'Spool erection completed in Area A. Approximately 18 spools installed.'
    });
  }

  if (lower.includes('weld') || lower.includes('line 24')) {
    events.push({
      activityName: 'Field Welding Line 24',
      eventType: 'ACTIVITY_STARTED',
      quantity: 12,
      unit: 'JOINT',
      area: 'Area B',
      discipline: 'PIPING',
      confidence: 0.91,
      evidence: 'Field welding started on Line 24 at 10:30 in Area B.'
    });
  }

  if (lower.includes('hydro') || lower.includes('test')) {
    events.push({
      activityName: 'Hydro Testing Preparation',
      eventType: 'ACTIVITY_IN_PROGRESS',
      quantity: 1,
      unit: 'LOOP',
      area: 'Area A',
      discipline: 'PIPING',
      confidence: 0.78,
      evidence: 'Hydro testing preparation is in progress for Line 24.'
    });
  }

  if (events.length === 0) {
    events.push({
      activityName: 'General Site Activity',
      eventType: 'ACTIVITY_IN_PROGRESS',
      quantity: 1,
      unit: 'NOS',
      area: 'Area A',
      discipline: 'PIPING',
      confidence: 0.85,
      evidence: content.slice(0, 100)
    });
  }

  return { extractedEvents: events, isSimulated: true };
}

export async function answerTimeAgentQueryWithGemini(
  userMessage: string,
  context: {
    project: any;
    activities: any[];
    metrics: any;
    clashes: any[];
    atRisk: any[];
  }
): Promise<{
  reply: string;
  intent: 'QUESTION_ANSWER' | 'FIELD_LOG' | 'SCHEDULE_INQUIRY' | 'RESOURCE_INQUIRY' | 'RISK_INQUIRY';
  extractedEvent?: {
    activityName: string;
    eventType: string;
    quantity: number;
    unit: string;
    area: string;
    discipline: string;
    confidence: number;
    evidenceSnippet?: string;
    matchedActivityId?: string;
    matchedActivityName?: string;
  };
  suggestedFollowUps?: string[];
  relatedActivities?: Array<{
    id: string;
    activity_id: string;
    name: string;
    progress: number;
    status: string;
    area: string;
  }>;
  relevantMetrics?: Array<{
    label: string;
    value: string | number;
    badge?: string;
    trend?: 'up' | 'down' | 'neutral';
  }>;
} | null> {
  const genAI = getGenAI();
  if (!genAI || !process.env.GEMINI_API_KEY) {
    return null;
  }

  try {
    const activitiesSummary = context.activities.slice(0, 20).map(a => 
      `- [${a.activity_id}] ${a.activity_name} (${a.discipline}, ${a.area}) | WBS: ${a.wbs_level} | Progress: ${a.progress}% | Status: ${a.status} | Dates: ${a.planned_start} to ${a.planned_finish} | Critical: ${a.critical_path ? 'YES' : 'NO'}`
    ).join('\n');

    const prompt = `You are SitePulse Time Agent, an expert AI Construction Project Intelligence and Field Assistant for EPC (Engineering, Procurement, Construction) projects.
Project Name: "${context.project?.name || 'PEP Expansion'}"
Overall Project Progress: ${context.project?.progress || 42}%
Pending Verification Matches in Queue: ${context.project?.pendingReviewsCount || 3}

Key Project Schedule Activities (Primavera P6 WBS):
${activitiesSummary}

Active Resource Clashes: ${context.clashes?.length || 0}
At-Risk Schedule Activities: ${context.atRisk?.length || 0}

User message:
"${userMessage}"

Tasks:
1. Determine if the user is:
   A) Reporting field execution progress/work (e.g. "We installed 14 spools in Area A today", "Welding on Line 24 started at 10am") -> Set intent: "FIELD_LOG" and extract structuredEvent attributes (activityName, eventType [ACTIVITY_STARTED, ACTIVITY_IN_PROGRESS, ACTIVITY_COMPLETED, MATERIAL_DELAY], quantity, unit, area, discipline, confidence [0.80-0.98], matchedActivityId, matchedActivityName from the schedule).
   B) Asking a question about project progress, schedule, dates, risks, critical path, or resources -> Set intent: "QUESTION_ANSWER" or "SCHEDULE_INQUIRY" or "RISK_INQUIRY" or "RESOURCE_INQUIRY". Provide a clear, professional, direct, and structured answer with relevant metrics and schedule activities.

2. Return valid JSON adhering strictly to this schema:
{
  "reply": "Conversational markdown answer formatted with bold text, bullet points, and key metrics.",
  "intent": "FIELD_LOG" | "QUESTION_ANSWER" | "SCHEDULE_INQUIRY" | "RESOURCE_INQUIRY" | "RISK_INQUIRY",
  "extractedEvent": { // Include only if user is reporting progress/field event
    "activityName": "string",
    "eventType": "ACTIVITY_STARTED" | "ACTIVITY_IN_PROGRESS" | "ACTIVITY_COMPLETED" | "MATERIAL_DELAY",
    "quantity": 10,
    "unit": "NOS" | "JOINT" | "M3" | "MTR" | "%",
    "area": "Area A" | "Area B" | "Substation A",
    "discipline": "PIPING" | "CIVIL" | "ELECTRICAL" | "STATIC_EQUIPMENT",
    "confidence": 0.92,
    "evidenceSnippet": "exact quote from message",
    "matchedActivityId": "act-id-if-found",
    "matchedActivityName": "L6-PIP-003-A: Spool Erection"
  },
  "suggestedFollowUps": ["Question 1", "Question 2", "Question 3"],
  "relatedActivities": [
    {
      "id": "act-id",
      "activity_id": "L6-PIP-001",
      "name": "Activity Name",
      "progress": 75,
      "status": "IN_PROGRESS",
      "area": "Area A"
    }
  ],
  "relevantMetrics": [
    {
      "label": "Piping Progress",
      "value": "58%",
      "badge": "On Track",
      "trend": "up"
    }
  ]
}`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini Time Agent processing error, reverting to deterministic model:', err);
  }
  return null;
}
