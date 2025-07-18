import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const textInput = formData.get('textInput') as string

    if (!image && !textInput) {
      return NextResponse.json(
        { success: false, message: "이미지 또는 텍스트 입력이 필요합니다." },
        { status: 400 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "API key not set." }, { status: 500 })
    }

    let endpoint = ""
    let body = {}

    if (textInput) {
      // 텍스트 입력으로 메뉴 구분
      endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
      
      const prompt = `다음 텍스트에서 메뉴 정보를 추출하여 JSON 배열로 반환해주세요. 각 메뉴는 name, description, price 필드를 가져야 합니다.

텍스트:
${textInput}

응답 형식:
[
  {
    "name": "메뉴명",
    "description": "메뉴 설명",
    "price": "가격"
  }
]

주의사항:
- 가격은 숫자만 포함하세요 (예: "4500" 또는 "4,500")
- 설명이 없는 경우 빈 문자열로 설정하세요
- 메뉴가 아닌 텍스트는 제외하세요
- JSON 형식만 반환하세요`

      body = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      }
    } else {
      // 이미지로 메뉴 추출
      endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
      
      const arrayBuffer = await image.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const base64Image = buffer.toString("base64")

      const prompt = `이 이미지는 메뉴판입니다. 메뉴 정보를 추출하여 JSON 배열로 반환해주세요. 각 메뉴는 name, description, price 필드를 가져야 합니다.

응답 형식:
[
  {
    "name": "메뉴명",
    "description": "메뉴 설명", 
    "price": "가격"
  }
]

주의사항:
- 가격은 숫자만 포함하세요 (예: "4500" 또는 "4,500")
- 설명이 없는 경우 빈 문자열로 설정하세요
- 메뉴가 아닌 텍스트는 제외하세요
- JSON 형식만 반환하세요`

      body = {
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: image.type || "image/jpeg",
                data: base64Image,
              },
            },
            {
              text: prompt,
            },
          ],
        }]
      }
    }

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ success: false, message: error.error?.message || "Gemini API error" }, { status: 500 })
    }

    const result = await response.json()
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return NextResponse.json({
      success: true,
      text: text
    })

  } catch (error: any) {
    console.error("Menu extraction error:", error)
    return NextResponse.json({ success: false, message: error.message || "Gemini API error" }, { status: 500 })
  }
} 