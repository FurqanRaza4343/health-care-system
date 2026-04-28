// AI Medical Image Analysis using Lovable AI Gateway (Gemini Vision)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, imageType, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!imageUrl) throw new Error("imageUrl required");

    const systemPrompt = `You are a medical imaging assistant. Analyze the provided medical image (${imageType ?? "unspecified"}). Return a structured assessment via the tool. NEVER replace a radiologist; clearly mark this as preliminary AI analysis. Be conservative, evidence-based, and flag any urgent findings.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analyze this ${imageType ?? "medical"} image. Patient context: ${context || "none provided"}.` },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_image_analysis",
              description: "Return a structured medical image assessment.",
              parameters: {
                type: "object",
                properties: {
                  modality: { type: "string", description: "Detected imaging modality (X-ray, MRI, CT, dermatology, etc.)" },
                  anatomy: { type: "string", description: "Body region depicted." },
                  overall_impression: { type: "string", description: "1-2 sentence summary." },
                  confidence: { type: "number", description: "Overall confidence 0-1." },
                  urgency: { type: "string", enum: ["emergency", "urgent", "routine", "normal"] },
                  findings: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        description: { type: "string" },
                        confidence: { type: "number", description: "0-1" },
                        severity: { type: "string", enum: ["normal", "mild", "moderate", "severe"] },
                        region: { type: "string", description: "Approx region in image (e.g. 'upper-right lung')." },
                      },
                      required: ["label", "description", "confidence", "severity", "region"],
                      additionalProperties: false,
                    },
                  },
                  differential_diagnosis: { type: "array", items: { type: "string" } },
                  recommendations: { type: "array", items: { type: "string" } },
                  limitations: { type: "string" },
                },
                required: ["modality", "anatomy", "overall_impression", "confidence", "urgency", "findings", "differential_diagnosis", "recommendations", "limitations"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_image_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No analysis returned");
    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("analyze-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
