import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateInsight(prompt) {
    if (!prompt?.trim()) return "No question provided."

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

        const result = await model.generateContent(`
You are a business intelligence analyst.
Analyze the following insurance analytics question and provide a short insight.
User question: ${prompt}
Respond in 2 concise sentences.
    `)

        return result.response.text()   // ✅ no await needed here

    } catch (err) {
        console.error("Gemini error:", err)
        return "Insight unavailable at this time."
    }
}