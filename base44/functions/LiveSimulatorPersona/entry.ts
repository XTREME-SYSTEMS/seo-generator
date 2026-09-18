import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, onboardingData, personaName, agreedToTOS, digitalSignature } = body || {};

    // Action: generate_persona — create a simulated human portfolio
    if (action === 'generate_persona') {
      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a realistic simulated human persona for a business operator. Generate:
1. A realistic full name
2. A background story (2-3 paragraphs)
3. A simulated digital footprint summary
4. Recommended starting strategy based on their profile

Persona preferences:
- Name preference: ${personaName || 'Auto-generate'}
- Risk tolerance: ${onboardingData?.riskTolerance || 'medium'}
- Budget: $${onboardingData?.budget || 10000}
- Business experience: ${onboardingData?.businessExperience || 'intermediate'}
- Tech experience: ${onboardingData?.techExperience || 'intermediate'}
- AI experience: ${onboardingData?.aiExperience || 'beginner'}
- Marketing/sales experience: ${onboardingData?.marketingExperience || 'intermediate'}
- Time availability: ${onboardingData?.timeAvailability || '20 hrs/week'}
- Financial desire: ${onboardingData?.financialDesire || '$50K/month'}
- Autonomy desire: ${onboardingData?.autonomyDesire || 'high'}

Return JSON:
{
  "name": "Full Name",
  "age": 35,
  "location": "City, State",
  "background": "2-3 paragraph backstory",
  "digitalFootprint": "Summary of existing digital presence",
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "recommendedStrategy": "Which of the 10 strategies fits best and why",
  "startingCapital": 10000,
  "projectedPath": "1-paragraph description of their projected journey"
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            age: { type: 'number' },
            location: { type: 'string' },
            background: { type: 'string' },
            digitalFootprint: { type: 'string' },
            strengths: { type: 'array', items: { type: 'string' } },
            weaknesses: { type: 'array', items: { type: 'string' } },
            recommendedStrategy: { type: 'string' },
            startingCapital: { type: 'number' },
            projectedPath: { type: 'string' },
          },
        },
      });
      return Response.json({ persona: llmResponse });
    }

    // Action: skip_trace — use CloudBrowser to do a digital background dig
    if (action === 'skip_trace') {
      const { email, accounts, fullName } = onboardingData || {};
      
      // Invoke the existing DispatchBrowserJob function for skip tracing
      let skipTraceResults = null;
      try {
        const browserRes = await base44.functions.invoke('DispatchBrowserJob', {
          kind: 'skip_trace',
          url: `https://www.google.com/search?q=${encodeURIComponent(fullName + ' ' + (email || ''))}`,
          actions: ['extract_text'],
          extract_schema: {
            type: 'object',
            properties: {
              searchResults: { type: 'array', items: { type: 'string' } },
              profiles: { type: 'array', items: { type: 'string' } },
              mentions: { type: 'array', items: { type: 'string' } },
            },
          },
        });
        skipTraceResults = browserRes;
      } catch (e) {
        console.error('Skip trace failed:', e.message);
        skipTraceResults = { error: e.message };
      }

      // Use LLM to analyze findings and identify gaps/opportunities
      let analysis = null;
      try {
        analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an elite digital intelligence analyst. Analyze this skip trace data and provide strategic intelligence.

Person: ${fullName}
Email: ${email}
Accounts: ${JSON.stringify(accounts)}
Skip Trace Results: ${JSON.stringify(skipTraceResults)}

Provide a JSON analysis:
{
  "digitalProfile": "Summary of digital footprint found",
  "gaps": ["gap1", "gap2", "gap3"],
  "potentialFailures": ["failure1", "failure2"],
  "achievements": ["achievement1", "achievement2"],
  "strategicOpportunities": ["opportunity1", "opportunity2", "opportunity3", "opportunity4", "opportunity5"],
  "invisibleCapabilities": ["capability1", "capability2", "capability3"],
  "leastKnownOpportunities": ["opp1", "opp2", "opp3"],
  "unfathomableResults": "Description of what's possible if strategy is followed exactly",
  "eliteStrategies": ["strategy1", "strategy2", "strategy3", "strategy4", "strategy5"],
  "recommendedNiches": ["niche1", "niche2", "niche3"],
  "fullAutonomyPath": "Description of the path to full autonomy"
}`,
          response_json_schema: {
            type: 'object',
            properties: {
              digitalProfile: { type: 'string' },
              gaps: { type: 'array', items: { type: 'string' } },
              potentialFailures: { type: 'array', items: { type: 'string' } },
              achievements: { type: 'array', items: { type: 'string' } },
              strategicOpportunities: { type: 'array', items: { type: 'string' } },
              invisibleCapabilities: { type: 'array', items: { type: 'string' } },
              leastKnownOpportunities: { type: 'array', items: { type: 'string' } },
              unfathomableResults: { type: 'string' },
              eliteStrategies: { type: 'array', items: { type: 'string' } },
              recommendedNiches: { type: 'array', items: { type: 'string' } },
              fullAutonomyPath: { type: 'string' },
            },
          },
          add_context_from_internet: true,
        });
      } catch (e) {
        console.error('Analysis failed:', e.message);
      }

      return Response.json({
        skipTraceResults,
        analysis,
        agreedToTOS,
        digitalSignature,
        timestamp: new Date().toISOString(),
      });
    }

    // Action: auto_recommend — generate strategic recommendations
    if (action === 'auto_recommend') {
      const { persona, skipTraceAnalysis, onboardingData: data } = body || {};
      
      const llmResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are the world's most elite strategic advisor with access to nearly all valuable strategies. Based on this persona and analysis, generate the ultimate strategic recommendation.

Persona: ${JSON.stringify(persona)}
Skip Trace Analysis: ${JSON.stringify(skipTraceAnalysis)}
Onboarding: ${JSON.stringify(data)}

Generate a JSON response with the TOP strategic recommendations that would produce unfathomable results:
{
  "ultimateStrategy": "The single most powerful strategy for this person",
  "topOpportunities": [
    { "name": "Opportunity name", "description": "Description", "potentialROI": "ROI estimate", "difficulty": "low/medium/high", "timeToResults": "timeline" }
  ],
  "eliteNiches": [
    { "niche": "Niche name", "why": "Why it's valuable", "marketSize": "$X", "competition": "low/medium/high", "automationPotential": "X%" }
  ],
  "invisibleStrategies": ["strategy1", "strategy2", "strategy3"],
  "fullAutonomyBlueprint": {
    "phase1": "Foundation phase description",
    "phase2": "Scaling phase description",
    "phase3": "Dominance phase description",
    "phase4": "Empire phase description"
  },
  "integrationStack": ["Google Calendar", "Gmail", "Supabase", "Vercel", "GitHub", "Railway", "Xtreme Communications", "Groq", "MCP"],
  "agentTeam": ["agent1", "agent2", "agent3", "agent4", "agent5"],
  "projectedResults": {
    "month3": "$X/month",
    "month6": "$X/month",
    "month12": "$X/month",
    "month24": "$X/month",
    "month36": "$X/month"
  }
}`,
        response_json_schema: {
          type: 'object',
          properties: {
            ultimateStrategy: { type: 'string' },
            topOpportunities: { type: 'array', items: { type: 'object' } },
            eliteNiches: { type: 'array', items: { type: 'object' } },
            invisibleStrategies: { type: 'array', items: { type: 'string' } },
            fullAutonomyBlueprint: { type: 'object' },
            integrationStack: { type: 'array', items: { type: 'string' } },
            agentTeam: { type: 'array', items: { type: 'string' } },
            projectedResults: { type: 'object' },
          },
        },
        add_context_from_internet: true,
      });

      return Response.json({ recommendations: llmResponse });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('LiveSimulatorPersona error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}