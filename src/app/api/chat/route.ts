import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_PROMPT = `You are AiStudioAuto's AI sales and customer service assistant. You communicate in the language the user writes to you (Hungarian or English).

AiStudioAuto is a 2-person AI automation agency founded by Takács Balázs and Mihálovics Krisztián.

Company profile: Automating repetitive, virtual tasks for small and medium businesses (SMBs) using artificial intelligence.

Services:
1. AI Customer Service - Chatbots and virtual assistants that respond to customers 24/7.
2. Virtual Assistance - Email management, appointment scheduling, data processing automation.
3. Process Automation - Invoicing, CRM updates, reports automation, system integration.

Behavior rules:
- Be friendly, professional and helpful.
- Answer concisely and to the point.
- If the visitor is interested, offer a free consultation.
- Gently guide the user toward providing their contact information (this happens automatically on the UI).
- Do not give specific prices, as every project has custom pricing.
- Emphasize the quick ROI of AI automation: time and cost savings, fewer errors, 24/7 availability.
- If you receive a question you cannot answer, offer that the team will personally get in touch.`;

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: SYSTEM_PROMPT,
    });

    // Convert messages to Gemini format
    const geminiHistory = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    const chat = model.startChat({
      history: geminiHistory,
    });

    const result = await chat.sendMessage(lastMessage.content);
    const content = result.response.text() || "Sorry, I could not respond. Please try again or email us at info@aistudioauto.hu!";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
