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
            text: `매장 주문 세션을 위한 재미있고 창의적인 제목을 하나만 생성해주세요.

매장 이름: ${shopName || '매장'}
            
요구사항:
- 한국어로 작성
- 10자 이내로 간결하게
- 재미있고 친근한 톤
- "~해서", "~때문에", "~하고 싶어서" 같은 패턴 사용
- 이모지 사용 가능
- 반드시 하나의 제목만 생성
- 매번 다른 창의적인 제목을 생성해주세요

다양한 주제로 제목을 만들어주세요:
- 음식/음료 관련: 맛있는 게 먹고 싶어서, 커피가 땡겨서, 달콤한 게 당겨서
- 감정/기분 관련: 기분이 좋아서, 행복해서, 힘들어서 쉬고 싶어서
- 활동 관련: 친구랑 수다 떨고 싶어서, 힐링하고 싶어서, 기분 전환 하고 싶어서
- 특별함 관련: 오늘만큼은 특별하게, 시원한 게 필요해서

위의 주제들을 참고해서 매번 다른 창의적인 제목을 하나만 생성해주세요.` 
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
    
    // 여러 제목이 있는 경우 첫 번째 제목만 추출
    // 줄바꿈이나 구분자로 나뉜 경우 첫 번째 것만 사용
    const lines = title.split(/[\n\r]+/).map((line: string) => line.trim()).filter((line: string) => line.length > 0)
    if (lines.length > 0) {
      title = lines[0]
    }
    
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
      "새로운 메뉴 시도 🆕",
      "맛있는 게 먹고 싶어서 😋",
      "달콤한 게 당겨서 🍰",
      "시원한 게 필요해서 🥤",
      "힘들어서 쉬고 싶어서 😌",
      "행복해서 🥳",
      "기분 전환 하고 싶어서 ✨",
      "친구랑 수다 떨고 싶어서 🗣️",
      "힐링하고 싶어서 🌿",
      "오늘만큼은 특별하게 🌟",
      "배고파서 🍔",
      "즐거워서 🎉",
      "새로운 맛을 시도하고 싶어서 🆕"
    ]
    
    const randomTitle = fallbackTitles[Math.floor(Math.random() * fallbackTitles.length)]
    
    return NextResponse.json({ 
      success: true, 
      title: randomTitle 
    })
  }
} 