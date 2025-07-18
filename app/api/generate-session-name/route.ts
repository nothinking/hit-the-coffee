import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shopName } = await request.json()

    // Gemini API 호출 - JSON 형식 요청 제거하고 직접 텍스트 응답 요청
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `매장 주문 세션을 위한 재미있고 창의적인 제목을 생성해주세요.

매장 이름: ${shopName || '매장'}
            
요구사항:
- 한국어로 작성
- 10자 이내로 간결하게
- 재미있고 친근한 톤
- "~해서", "~때문에", "~하고 싶어서" 같은 패턴 사용
- 이모지 사용 가능

예시:
- 기분이 좋아서 😊
- 커피가 땡겨서 ☕
- 친구들과 함께 👥
- 오늘은 특별히 ✨

위의 예시와 같은 형식으로 제목만 생성해주세요. JSON 형식이나 다른 설명 없이 제목만 답변해주세요.` 
          }]
        }]
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API')
    }

    let title = data.candidates[0].content.parts[0].text.trim()
    
    // JSON 형식이 포함되어 있는지 확인하고 제거
    if (title.includes('{') && title.includes('}')) {
      try {
        const jsonMatch = title.match(/\{.*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.title) {
            title = parsed.title
          }
        }
      } catch (parseError) {
        // JSON 파싱 실패시 텍스트에서 JSON 부분 제거
        title = title.replace(/\{.*\}/g, '').trim()
      }
    }
    
    // 따옴표나 불필요한 문자 제거
    title = title.replace(/^["']|["']$/g, '').trim()
    
    // 기본값으로 폴백
    if (!title || title.length === 0) {
      title = "오늘은 특별히 ✨"
    }

    return NextResponse.json({ 
      success: true, 
      title 
    })

  } catch (error) {
    console.error('Session name generation error:', error)
    
    // 에러 발생시 기본 제목들 중에서 선택
    const fallbackTitles = [
      "기분이 좋아서 😊",
      "커피가 땡겨서 ☕", 
      "친구들과 함께 👥",
      "오늘은 특별히 ✨",
      "스트레스 해소 💆‍♂️",
      "커피 한 잔의 여유 ☕",
      "오후의 힐링 🌅",
      "새로운 메뉴 시도 🆕"
    ]
    
    const randomTitle = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)]
    
    return NextResponse.json({ 
      success: true, 
      title: randomTitle 
    })
  }
} 