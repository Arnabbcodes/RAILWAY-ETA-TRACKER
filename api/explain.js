

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const GROQ_API_KEY = process.env.GROQ_API_KEY;

  if (!GROQ_API_KEY) {
    return res.status(500).json({
      error: "Server misconfiguration: GROQ_API_KEY is not set in environment variables.",
    });
  }

  try {
    const { origin, destination, distanceKm, speedKmh, traffic, etaMinutes } = req.body;

    // Basic validation
    if (
      !origin ||
      !destination ||
      distanceKm === undefined ||
      speedKmh === undefined ||
      !traffic ||
      etaMinutes === undefined
    ) {
      return res.status(400).json({ error: "Missing required trip fields." });
    }

    // Build the prompt for Groq
    const prompt = `A user is traveling from "${origin}" to "${destination}".
Trip details:
- Distance: ${distanceKm} km
- Average speed: ${speedKmh} km/h
- Traffic condition: ${traffic}
- Calculated ETA: ${etaMinutes} minutes

Write a short (2-3 sentence), friendly, natural-language explanation of this ETA for the user.
Mention how traffic affected the estimate. Do not repeat raw numbers mechanically — explain it conversationally.`;

    // Call Groq's OpenAI-compatible chat completions endpoint
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that explains travel ETAs clearly and briefly.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!groqResponse.ok) {
      const errText = await groqResponse.text();
      console.error("Groq API error:", errText);
      return res.status(502).json({ error: "Groq API request failed.", details: errText });
    }

    const groqData = await groqResponse.json();
    const explanation =
      groqData.choices?.[0]?.message?.content?.trim() ||
      "ETA calculated, but no explanation was returned.";

    return res.status(200).json({ explanation });

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: "Internal server error.", details: err.message });
  }
}
