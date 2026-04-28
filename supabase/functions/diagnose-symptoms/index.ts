// AI Symptom Diagnosis using Lovable AI Gateway (Gemini)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms, bodyAreas, severity, duration, age, allergies } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are a medical triage assistant. You DO NOT replace a doctor. Given symptoms, return structured JSON via the provided tool. Be concise, evidence-based, and conservative. Flag emergencies (chest pain with sweating, stroke signs, severe bleeding, anaphylaxis, suicidal ideation) with urgency="emergency".`;

    const userPrompt = `Patient context:
- Age: ${age ?? "unknown"}
- Known allergies: ${(allergies ?? []).join(", ") || "none"}
- Affected body areas: ${(bodyAreas ?? []).join(", ") || "unspecified"}
- Severity (1-10): ${severity ?? "unknown"}
- Duration: ${duration ?? "unknown"}
- Symptoms described: ${symptoms}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_diagnosis",
              description: "Return a structured triage assessment.",
              parameters: {
                type: "object",
                properties: {
                  urgency: { type: "string", enum: ["emergency", "urgent", "routine", "self-care"] },
                  summary: { type: "string", description: "2-3 sentence plain-language summary." },
                  possible_conditions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        likelihood: { type: "string", enum: ["high", "medium", "low"] },
                        description: { type: "string" },
                      },
                      required: ["name", "likelihood", "description"],
                      additionalProperties: false,
                    },
                  },
                  recommendations: { type: "array", items: { type: "string" } },
                  recommended_specialists: { type: "array", items: { type: "string" } },
                  red_flags: { type: "array", items: { type: "string" } },
                },
                required: ["urgency", "summary", "possible_conditions", "recommendations", "recommended_specialists", "red_flags"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_diagnosis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in your workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No diagnosis returned");
    const diagnosis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ diagnosis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("diagnose-symptoms error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
