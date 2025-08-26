
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const { category, title } = await req.json();

    if (!category || !title) {
      return NextResponse.json(
        { error: "Category and title are required" },
        { status: 400 }
      );
    }

    // Use the official Google GenAI SDK
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    let response;
    try {
      response = await ai.models.generateContent({
        model: "gemini-1.5-pro-latest", // use the latest public Gemini model
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are a recommendation engine. The user will give you a category and a title they like. Return a list of 5 similar ${category}s, with a one-line description each. Respond ONLY in valid JSON array format: [{ "title": "...", "description": "..." }, ...]\nCategory: ${category}, Title: ${title}`
              }
            ]
          }
        ]
      });
    } catch (err) {
      console.error("Gemini SDK error:", err);
      return NextResponse.json({ error: "Gemini SDK error", raw: err }, { status: 500 });
    }

    let text = response?.text || (response?.candidates?.[0]?.content?.parts?.[0]?.text ?? "");
    let recommendations = [];
    try {
      recommendations = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse model response:", text);
      return NextResponse.json({ error: "Failed to parse model response", raw: text, gemini: response }, { status: 500 });
    }

    if (!Array.isArray(recommendations) || recommendations.length === 0) {
      console.error("Gemini returned empty or invalid recommendations:", text);
      return NextResponse.json({ error: "Gemini returned empty or invalid recommendations", raw: text, gemini: response }, { status: 500 });
    }

    return NextResponse.json({ recommendations, raw: text, gemini: response });

  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
