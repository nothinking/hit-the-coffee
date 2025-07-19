import { NextRequest, NextResponse } from "next/server"
import { Buffer } from "buffer"

export const runtime = "nodejs"

// 규칙 기반 메뉴 파싱 함수
function parseMenuFromText(textInput: string): any[] {
  const lines = textInput.split('\n').filter(line => line.trim() !== '')
  const menus: any[] = []

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (!trimmedLine) continue

    // 다양한 구분자 패턴 시도
    let name = ''
    let description = ''
    let price = ''

    // 패턴 1: "메뉴명 - 설명 - 가격" 형식
    const pattern1 = /^(.+?)\s*-\s*(.+?)\s*-\s*(\d+(?:,\d+)*원?)$/
    const match1 = trimmedLine.match(pattern1)
    
    if (match1) {
      name = match1[1].trim()
      description = match1[2].trim()
      price = match1[3].replace(/[^\d]/g, '') // 숫자만 추출
    } else {
      // 패턴 2: "메뉴명 설명 가격" 형식 (구분자가 없는 경우)
      const pattern2 = /^(.+?)\s+(.+?)\s+(\d+(?:,\d+)*원?)$/
      const match2 = trimmedLine.match(pattern2)
      
      if (match2) {
        name = match2[1].trim()
        description = match2[2].trim()
        price = match2[3].replace(/[^\d]/g, '')
      } else {
        // 패턴 3: "메뉴명 가격" 형식 (설명이 없는 경우)
        const pattern3 = /^(.+?)\s+(\d+(?:,\d+)*원?)$/
        const match3 = trimmedLine.match(pattern3)
        
        if (match3) {
          name = match3[1].trim()
          description = ''
          price = match3[2].replace(/[^\d]/g, '')
        } else {
          // 패턴 4: 가격이 맨 뒤에 있는 경우 (더 유연한 패턴)
          const pattern4 = /^(.+?)\s+(\d+(?:,\d+)*원?)$/
          const match4 = trimmedLine.match(pattern4)
          
          if (match4) {
            name = match4[1].trim()
            description = ''
            price = match4[2].replace(/[^\d]/g, '')
          } else {
            // 패턴 5: 가격이 숫자만 있는 경우
            const pattern5 = /^(.+?)\s+(\d+)$/
            const match5 = trimmedLine.match(pattern5)
            
            if (match5) {
              name = match5[1].trim()
              description = ''
              price = match5[2]
            } else {
              // 기본값: 전체를 메뉴명으로 처리
              name = trimmedLine
              description = ''
              price = '0'
            }
          }
        }
      }
    }

    // 메뉴명이 숫자만 있는 경우 제외
    if (/^\d+$/.test(name)) {
      continue
    }

    // 가격이 0인 경우 기본값 설정
    if (!price || price === '0') {
      price = '0'
    }

    menus.push({
      name: name,
      description: description,
      price: price
    })
  }

  return menus
}

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

    if (textInput) {
      // Gemini API를 사용한 텍스트 파싱
      const apiKey = process.env.GEMINI_API_KEY
      if (!apiKey) {
        return NextResponse.json({ success: false, message: "API key not set." }, { status: 500 })
      }

      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
      
      const prompt = `다음은 음성 인식으로 입력된 메뉴 정보입니다. 메뉴 정보를 추출하여 JSON 배열로 반환해주세요. 각 메뉴는 name, description, price 필드를 가져야 합니다.

입력 텍스트:
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
- JSON 형식만 반환하세요
- 음성 인식 오류로 인한 잘못된 텍스트는 수정해서 반환하세요`

      const body = {
        contents: [{
          parts: [
            {
              text: prompt,
            },
          ],
        }]
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
    }

    // 이미지 처리 (AI 사용)
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "API key not set." }, { status: 500 })
    }

    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
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

    const body = {
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