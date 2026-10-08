import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ flagged: false });
    }

    const response = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    console.log(
      "FULL MODERATION RESPONSE:",
      JSON.stringify(response, null, 2)
    );

    const flagged = response?.results?.[0]?.flagged ?? false;

    return NextResponse.json({ flagged });
  } catch (error) {
    console.error("Moderation error:", error);
    return NextResponse.json(
      { error: "Moderation failed" },
      { status: 500 }
    );
  }
}