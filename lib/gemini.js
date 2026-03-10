import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export async function generateInsight(prompt) {

    if (!prompt?.trim()) {
        return "No question provided."
    }

    try {

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash"
        });

        const result = await model.generateContent(`
You are a business intelligence analyst.

Analyze the following insurance analytics question and provide a short insight.

User question: ${prompt}

Respond in 2 concise sentences.
`)

        const response = await result.response

        return response.text()

    } catch (error) {

        console.error("Gemini Error:", error)

        return "Insight unavailable at the moment."

    }

}