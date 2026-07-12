import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("Invalid AI JSON response");
    }

    return JSON.parse(match[0]);
  }
}

export async function generatePortfolioAI(data: any) {
  const prompt = `

You are an expert freelance portfolio writer.

Create a professional portfolio for a student
who completed virtual internship projects.


Student Name:
${data.name}


Domain:
${data.domain}


Existing Skills:
${JSON.stringify(data.skills)}


Projects:

${JSON.stringify(data.projects)}



Return JSON only:

{
"headline":"",
"bio":"",
"skills":[],
"projects":[
 {
  "assignment_id":"",
  "title":"",
  "description":""
 }
]
}


Rules:

- Do not invent projects.
- Do not add technologies that are not provided.
- Write professional freelancer style descriptions.
- Keep information realistic.

`;

  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",

    temperature: 0.4,

    messages: [
      {
        role: "system",
        content: "You create professional freelancer portfolios.",
      },

      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const result = response.choices[0]?.message?.content;

  if (!result) {
    throw new Error("AI returned empty response");
  }

  return extractJson(result);
}
