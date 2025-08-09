import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { category, title } = await req.json();

    if (!category || !title) {
      return NextResponse.json(
        { error: "Category and title are required" },
        { status: 400 }
      );
    }

    //call OpenAi API
    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a recommendation engine. 
            The user will give you a category and a title they like.
            Return a short list of 5 similar ${category}s, with a one-line description each.
            Respond in JSON with this format:
            [{ "title": "...", "description": "..." }, ...]`,
            },
            {
              role: "user",
              content: `Category: ${category}, Title: ${title}`,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    const data = await openaiRes.json();

    // Parse the model's JSON output
    let recommendations;
    try {
      recommendations = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      recommendations = [];
    }

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Error in recommendations API:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
