// Mistral-based symptom diagnosis using Supabase Edge Function (server-side secret)
// Expects: { symptoms, bodyAreas, severity, duration }

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type InputPayload = {
  symptoms: string;
  bodyAreas?: string[];
  severity?: number;
  duration?: string;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, bodyAreas, severity, duration } = (await req.json()) as InputPayload;

    const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY");
    if (!MISTRAL_API_KEY) {
      throw new Error("MISTRAL_API_KEY not configured (Edge Function env var missing)");
    }

    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${MISTRAL_API_KEY}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          {
            role: "system",
            content:
              'You are an AI medical symptom checker. Based on the user\'s symptoms, provide a JSON response exactly in this format: {"urgency": "emergency" | "urgent" | "routine" | "self-care", "summary": "short details of the condition", "possible_conditions": [{"name": "", "likelihood": "high"|"medium"|"low", "description": ""}], "recommendations": [], "recommended_specialists": [], "red_flags": []}. Return ONLY valid JSON.',
          },
          {
            role: "user",
            content: `Symptoms: ${symptoms}\nAreas: ${(bodyAreas ?? []).join(", ")}\nSeverity: ${severity ?? ""}/10\nDuration: ${duration ?? ""}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Mistral API failed (${response.status}): ${text}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("No content returned from Mistral");
    }

    const dx = JSON.parse(content);

    return new Response(JSON.stringify({ diagnosis: dx }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
