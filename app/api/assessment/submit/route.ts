import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type SubmitBody = {
  selectedDomains: string[];
  answers: Record<string, string>;
};

type QuestionRow = {
  id: string;
  question_text: string;
  correct_answer: string;
  domain_id: string | null;
  domains?: {
    id?: string;
    name: string;
  } | null;
};

type DomainStat = {
  correct: number;
  total: number;
  percentage: number;
};

async function getAIRecommendation(params: {
  domainScores: Record<string, DomainStat>;
  recommendedDomains: string[];
  skillLevel: string;
  totalScore: number;
  totalQuestions: number;
  percentageScore: number;
}) {
  const {
    domainScores,
    recommendedDomains,
    skillLevel,
    totalScore,
    totalQuestions,
    percentageScore,
  } = params;

  const domainSummary = Object.entries(domainScores)
    .map(
      ([domain, stats]) =>
        `${domain}: ${stats.correct}/${stats.total} (${stats.percentage.toFixed(2)}%)`,
    )
    .join("\n");

  const prompt = `
A student completed a freelancing skill assessment.

Overall Result:
- Skill Level: ${skillLevel}
- Total Score: ${totalScore}/${totalQuestions}
- Percentage Score: ${percentageScore.toFixed(2)}%
- Top Recommended Domains: ${recommendedDomains.join(", ") || "None"}

Domain-wise Performance:
${domainSummary}

Return valid JSON only in this exact format:
{
  "primary_domain": "string",
  "secondary_domains": ["string"],
  "reason": "2-3 sentence explanation",
  "career_advice": "2-3 sentence practical next step advice",
  "confidence": "high | medium | low"
}

Rules:
- Recommend the best freelancing domain based on actual performance.
- Advice must be practical for a beginner/student.
- Do not use markdown.
- Return JSON only.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an expert AI assistant for skill assessment and freelancing career guidance.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim();

    if (!raw) {
      return {
        primary_domain: recommendedDomains[0] || "Beginner Freelancing Path",
        secondary_domains: recommendedDomains.slice(1),
        reason:
          "Your recommendation is based on your strongest assessment performance.",
        career_advice:
          "Start with beginner-level projects in your strongest domain and improve through regular practice.",
        confidence: "medium",
      };
    }

    try {
      return JSON.parse(raw);
    } catch {
      return {
        primary_domain: recommendedDomains[0] || "Beginner Freelancing Path",
        secondary_domains: recommendedDomains.slice(1),
        reason:
          "Your recommendation is based on your strongest assessment performance.",
        career_advice:
          "Start with beginner-level projects in your strongest domain and improve through regular practice.",
        confidence: "medium",
      };
    }
  } catch (error) {
    console.error("AI recommendation error:", error);

    return {
      primary_domain: recommendedDomains[0] || "Beginner Freelancing Path",
      secondary_domains: recommendedDomains.slice(1),
      reason:
        "Your recommendation is based on your strongest assessment performance.",
      career_advice:
        "Start with beginner-level projects in your strongest domain and improve through regular practice.",
      confidence: "medium",
    };
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { error: "Missing or invalid authorization token." },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return Response.json({ error: "Unauthorized user." }, { status: 401 });
    }

    const body: SubmitBody = await req.json();
    const { selectedDomains, answers } = body;

    if (
      !Array.isArray(selectedDomains) ||
      selectedDomains.length === 0 ||
      typeof answers !== "object" ||
      !answers ||
      Object.keys(answers).length === 0
    ) {
      return Response.json(
        { error: "Invalid request payload." },
        { status: 400 },
      );
    }

    const questionIds = Object.keys(answers);

    const { data: questions, error: questionsError } = await supabaseAdmin
      .from("questions")
      .select(
        `
        id,
        question_text,
        correct_answer,
        domain_id,
        domains ( id, name )
      `,
      )
      .in("id", questionIds)
      .eq("is_active", true);

    if (questionsError || !questions || questions.length === 0) {
      return Response.json({ error: "Questions not found." }, { status: 400 });
    }

    const typedQuestions = questions as unknown as QuestionRow[];

    const filteredQuestions = typedQuestions.filter((q) =>
      selectedDomains.includes(q.domains?.name || ""),
    );

    if (!filteredQuestions.length) {
      return Response.json(
        { error: "No valid questions found for selected domains." },
        { status: 400 },
      );
    }

    const domainScores: Record<string, DomainStat> = {};
    const answerDetails: Array<{
      question_id: string;
      selected_answer: string | null;
      correct_answer: string;
      is_correct: boolean;
      domain_id: string | null;
    }> = [];

    let totalScore = 0;

    for (const q of filteredQuestions) {
      const domainName = q.domains?.name || "Unknown";
      const selectedAnswer = answers[q.id] ?? null;
      const isCorrect = selectedAnswer === q.correct_answer;

      if (!domainScores[domainName]) {
        domainScores[domainName] = {
          correct: 0,
          total: 0,
          percentage: 0,
        };
      }

      domainScores[domainName].total += 1;

      if (isCorrect) {
        domainScores[domainName].correct += 1;
        totalScore += 1;
      }

      answerDetails.push({
        question_id: q.id,
        selected_answer: selectedAnswer,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        domain_id: q.domain_id,
      });
    }

    for (const domain of Object.keys(domainScores)) {
      const stat = domainScores[domain];
      stat.percentage =
        stat.total > 0
          ? Number(((stat.correct / stat.total) * 100).toFixed(2))
          : 0;
    }

    const totalQuestions = filteredQuestions.length;
    const percentageScore =
      totalQuestions > 0
        ? Number(((totalScore / totalQuestions) * 100).toFixed(2))
        : 0;

    const skillLevel =
      percentageScore >= 80
        ? "Advanced"
        : percentageScore >= 50
          ? "Intermediate"
          : "Beginner";

    const sortedDomains = Object.entries(domainScores)
      .sort((a, b) => {
        if (b[1].percentage !== a[1].percentage) {
          return b[1].percentage - a[1].percentage;
        }
        return b[1].correct - a[1].correct;
      })
      .map(([domain]) => domain);

    const recommendedDomains =
      sortedDomains.length > 0 ? sortedDomains : ["Beginner Freelancing Path"];

    const aiResult = await getAIRecommendation({
      domainScores,
      recommendedDomains,
      skillLevel,
      totalScore,
      totalQuestions,
      percentageScore,
    });

    const aiPrimaryDomain =
      typeof aiResult?.primary_domain === "string"
        ? aiResult.primary_domain.trim()
        : "";

    const primaryDomain =
      recommendedDomains.find(
        (domain) => domain.toLowerCase() === aiPrimaryDomain.toLowerCase(),
      ) ||
      recommendedDomains[0] ||
      "Beginner Freelancing Path";

    const aiSecondaryDomains = Array.isArray(aiResult?.secondary_domains)
      ? aiResult.secondary_domains
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    const secondaryDomains = aiSecondaryDomains.length
      ? aiSecondaryDomains.filter(
          (domain) =>
            domain.toLowerCase() !== primaryDomain.toLowerCase() &&
            recommendedDomains.some(
              (recommended) =>
                recommended.toLowerCase() === domain.toLowerCase(),
            ),
        )
      : recommendedDomains
          .filter(
            (domain) => domain.toLowerCase() !== primaryDomain.toLowerCase(),
          )
          .slice(0, 2);

    const aiRecommendationText = [
      aiResult?.reason ||
        "Recommendation based on your strongest assessment area.",
      aiResult?.career_advice ||
        "Start with beginner-friendly freelancing tasks in your recommended domain.",
      `Confidence: ${aiResult?.confidence || "medium"}`,
    ].join("\n\n");

    const { data: savedResult, error: resultInsertError } = await supabaseAdmin
      .from("assessment_results")
      .insert({
        user_id: user.id,
        selected_domains: selectedDomains,
        domain_scores: domainScores,
        recommended_domain: [primaryDomain],
        secondary_recommendations: secondaryDomains,
        total_score: totalScore,
        total_questions: totalQuestions,
        percentage_score: percentageScore,
        skill_level: skillLevel,
        ai_recommendation: aiRecommendationText,
        status: "completed",
      })
      .select("id")
      .single();

    if (resultInsertError || !savedResult) {
      console.error("assessment_results insert error:", resultInsertError);

      return Response.json(
        { error: "Failed to save assessment result." },
        { status: 500 },
      );
    }

    const answerRows = answerDetails.map((item) => ({
      assessment_result_id: savedResult.id,
      user_id: user.id,
      question_id: item.question_id,
      selected_answer: item.selected_answer,
      correct_answer: item.correct_answer,
      is_correct: item.is_correct,
      domain_id: item.domain_id,
    }));

    const { error: answersInsertError } = await supabaseAdmin
      .from("assessment_answer_details")
      .insert(answerRows);

    if (answersInsertError) {
      console.error(
        "assessment_answer_details insert error:",
        answersInsertError,
      );
    }

    const domainNamesToFetch = [primaryDomain, ...secondaryDomains].filter(
      Boolean,
    );

    let primaryDomainId: string | null = null;
    let secondaryDomainId: string | null = null;

    if (domainNamesToFetch.length > 0) {
      const { data: matchedDomains, error: domainLookupError } =
        await supabaseAdmin
          .from("domains")
          .select("id, name")
          .in("name", domainNamesToFetch);

      if (domainLookupError) {
        console.error("domain lookup error:", domainLookupError);
      }

      const domainMap = new Map(
        (matchedDomains || []).map((d) => [d.name.toLowerCase(), d.id]),
      );

      primaryDomainId = primaryDomain
        ? domainMap.get(primaryDomain.toLowerCase()) || null
        : null;

      secondaryDomainId =
        secondaryDomains.length > 0
          ? domainMap.get(secondaryDomains[0].toLowerCase()) || null
          : null;
    }

    const { error: profileUpdateError } = await supabaseAdmin
      .from("profiles")
      .update({
        primary_domain: primaryDomain,
        recommended_domain: primaryDomain,
        secondary_domains: secondaryDomains,
        primary_domain_id: primaryDomainId,
        secondary_domain_id: secondaryDomainId,
        current_skill_level: skillLevel,
        skill_level: skillLevel,
        last_assessment_at: new Date().toISOString(),
        selected_task_domain_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("profiles update error:", profileUpdateError);
    }

    return Response.json({
      assessmentResultId: savedResult.id,
      recommendedDomains: [primaryDomain, ...secondaryDomains],
      skillLevel,
      aiRecommendation: aiRecommendationText,
      totalScore,
      totalQuestions,
      percentageScore,
      domainScores,
      primaryDomainId,
      secondaryDomainId,
    });
  } catch (error) {
    console.error("ASSESSMENT SUBMIT ERROR:", error);

    return Response.json(
      { error: "Failed to submit assessment." },
      { status: 500 },
    );
  }
}
