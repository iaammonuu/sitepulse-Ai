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
