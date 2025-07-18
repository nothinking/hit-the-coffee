import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "buffer";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ success: false, message: "No image file provided." }, { status: 400 });
  }

  // Blob -> ArrayBuffer -> base64
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString("base64");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, message: "API key not set." }, { status: 500 });
  }

  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const prompt = `이 이미지는 카페의 메뉴판입니다.\n각 메뉴의 이름(name), 설명(description), 가격(price)을 반드시 포함하여 JSON 배열로 추출해줘.\n모든 메뉴 항목에 세 필드가 빠짐없이 들어가야 하며, 설명이나 가격이 없으면 빈 문자열(\"\") 또는 0으로 채워줘.\n예시:\n[\n  {\"name\": \"아메리카노\", \"description\": \"진한 커피\", \"price\": \"2000\"},\n  {\"name\": \"카페라떼\", \"description\": \"우유가 들어간 부드러운 커피\", \"price\": \"2500\"},\n  {\"name\": \"에스프레소\", \"description\": \"\", \"price\": \"1800\"}\n]\nJSON 코드블록으로 감싸지 말고, 배열만 반환해줘.`;

  const body = {
    contents: [
      {
        parts: [
          {
            inline_data: {
              mime_type: file.type || "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ success: false, message: error.error?.message || "Gemini Vision API error" }, { status: 500 });
    }

    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return NextResponse.json({ success: true, text });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Gemini Vision API error" }, { status: 500 });
  }
} 