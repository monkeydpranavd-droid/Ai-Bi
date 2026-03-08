import { generateInsight } from "@/lib/gemini"

export async function POST(req) {

    const body = await req.json()
    const prompt = body.prompt.toLowerCase()

    let chart = "settlement"

    if (
        prompt.includes("trend") ||
        prompt.includes("year") ||
        prompt.includes("history")
    ) {
        chart = "trend"
    }

    else if (
        prompt.includes("repud") ||
        prompt.includes("reject") ||
        prompt.includes("denied")
    ) {
        chart = "repud"
    }

    else if (
        prompt.includes("volume") ||
        prompt.includes("scatter") ||
        prompt.includes("performance")
    ) {
        chart = "scatter"
    }

    let insight = ""

    try {

        insight = await generateInsight(prompt)

    } catch (error) {

        console.log("Gemini error:", error)
        insight = "AI insight generation failed."

    }

    return Response.json({
        chart,
        insight
    })
}