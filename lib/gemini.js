import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateInsight(prompt) {
    const model = genAI.getGenerativeModel(
        { model: "gemini-2.0-flash" },
        { apiVersion: "v1" }  // ✅ Force v1 instead of v1beta
    )

    const result = await model.generateContent(`
You are a business intelligence analyst.

User question: ${prompt}

Provide a short 2 sentence insight about insurance claim analytics.
`)

    const response = await result.response
    return response.text()
}