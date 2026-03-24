import OpenAI from "openai"

export const runtime = "nodejs"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { scores } = await req.json()

    const prompt = `
A student completed a skill assessment.

Scores:
${Object.entries(scores)
  .map(([k, v]) => `${k}: ${v}`)
  .join("\n")}

Recommend the best freelancing domain and explain why in 3-4 lines.
`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    return Response.json({
      result: response.choices[0].message.content,
    })
  } catch (error) {
    console.error("AI ERROR:", error)

    return Response.json(
      { result: "AI recommendation failed." },
      { status: 500 }
    )
  }
}