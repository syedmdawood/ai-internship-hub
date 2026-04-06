import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type DomainScoreStats = {
  correct: number;
  total: number;
  percentage: number;
};

type RecommendRequestBody = {
  domainScores: Record<string, DomainScoreStats>;
  recommendedDomains: string[];
  skillLevel: string;
  totalScore: number;
  totalQuestions: number;
  percentageScore: number;
};

export async function POST(req: Request) {
  try {
    const body: RecommendRequestBody = await req.json();

    const {
      domainScores,
      recommendedDomains,
      skillLevel,
      totalScore,
      totalQuestions,
      percentageScore,
    } = body;

    if (
      !domainScores ||
      typeof domainScores !== "object" ||
      !Array.isArray(recommendedDomains) ||
      !skillLevel ||
      typeof totalScore !== "number" ||
      typeof totalQuestions !== "number" ||
      typeof percentageScore !== "number"
    ) {
      return Response.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const domainSummary = Object.entries(domainScores)
      .map(
        ([domain, stats]) =>
          `${domain}: ${stats.correct}/${stats.total} (${stats.percentage.toFixed(2)}%)`
      )
      .join("\n");

    const prompt = `
A student completed a freelancing skill assessment.

Overall Result:
- Skill Level: ${skillLevel}
- Total Score: ${totalScore}/${totalQuestions}
- Percentage Score: ${percentageScore.toFixed(2)}%
- Recommended Domains from scoring logic: ${recommendedDomains.join(", ")}

Domain-wise Performance:
${domainSummary}

Based on this assessment, return a JSON object only in this exact format:
{
  "primary_domain": "string",
  "secondary_domains": ["string"],
  "reason": "2-3 sentence explanation",
  "career_advice": "2-3 sentence practical next step advice",
  "confidence": "high | medium | low"
}

Rules:
- Choose the best freelancing domain based on actual performance.
- Keep the advice practical for a student or beginner.
- Do not include markdown.
- Return valid JSON only.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an expert career guidance assistant for freelancing and student skill assessment.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();

    if (!raw) {
      return Response.json(
        { error: "Empty response from AI." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return Response.json(
        {
          error: "AI returned invalid JSON.",
          raw,
        },
        { status: 500 }
      );
    }

    return Response.json({
      result: parsed,
    });
  } catch (error) {
    console.error("AI ERROR:", error);

    return Response.json(
      {
        error: "AI recommendation failed.",
      },
      { status: 500 }
    );
  }
}