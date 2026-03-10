import Groq from "groq-sdk"

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

export async function generateInsight(prompt) {

    try {

        const completion = await groq.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [
                {
                    role: "system",
                    content: "You are a business intelligence analyst. Provide short insights from analytics queries."
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        })

        return completion.choices[0]?.message?.content

    } catch (error) {

        console.error("Groq Error:", error)

        return "Insight unavailable at the moment."

    }

}