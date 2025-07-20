import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { shopName } = await request.json()
    console.log('Received shopName:', shopName)

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
현재 시간: ${new Date().toLocaleString('ko-KR')}
랜덤 시드: ${Math.random().toString(36).substring(7)}
            
중요한 규칙:
- 매장 이름을 절대 포함하지 마세요
- "{매장이름} 모닝", "{매장이름}에서" 같은 패턴 금지
- 매장 이름과 관련된 어떤 표현도 사용하지 마세요
- 완전히 독립적이고 일반적인 제목만 생성하세요
- "오늘의", "행복한 주문" 패턴 금지
- "~하고 싶어서", "~해서" 패턴보다는 다른 표현 사용
- 매번 완전히 다른 패턴을 사용하세요

요구사항:
- 한국어로 작성
- 10자 이내로 간결하게
- 재미있고 친근한 톤
- 이모지 사용 가능
- 반드시 하나의 제목만 생성
- 매번 완전히 다른 창의적인 제목을 생성해주세요

다양한 패턴과 주제로 제목을 만들어주세요:

1. 음식/음료 관련:
   - 맛있는 게 먹고 싶어서 😋
   - 커피가 땡겨서 ☕
   - 달콤한 게 당겨서 🍰
   - 배고파서 🍔
   - 시원한 게 필요해서 🥤
   - 카페인 부족 🥱
   - 달콤한 유혹 🍯

2. 감정/기분 관련:
   - 기분이 좋아서 😊
   - 행복해서 🥳
   - 스트레스 해소 💆‍♂️
   - 즐거워서 🎉
   - 힘들어서 쉬고 싶어서 😌
   - 설레는 순간 💕
   - 기분 업그레이드 ⬆️

3. 활동/상황 관련:
   - 친구랑 수다 떨고 싶어서 🗣️
   - 기분 전환 하고 싶어서 ✨
   - 오후의 여유 ☀️
   - 새로운 맛을 시도하고 싶어서 🆕
   - 팀원들과 함께 👥
   - 소소한 즐거움 🎈
   - 일상의 작은 축제 🎊

4. 특별함/모티브 관련:
   - 오늘만큼은 특별하게 🌟
   - 새로운 시작 🚀
   - 작은 축하 🎊
   - 일상의 휴식 🌿
   - 맛있는 발견 🔍
   - 행복한 순간 🌈
   - 기적 같은 맛 ✨

5. 시간/계절 관련:
   - 오후의 힐링 🌅
   - 아침의 활력 🌅
   - 저녁의 여유 🌙
   - 주말의 특별함 🎈
   - 하루의 마무리 🌆
   - 새로운 하루의 시작 🌅

6. 창의적 표현:
   - 맛있는 모험 🗺️
   - 달콤한 휴식 🍰
   - 커피 한 잔의 여유 ☕
   - 행복한 충전 🔋
   - 기분 좋은 하루 🌞
   - 맛있는 기적 ✨

7. 새로운 아이디어:
   - 카페인 충전 완료! 🚀
   - 달콤한 휴식 시간 🍰
   - 맛있는 발견 🔍
   - 소소한 즐거움 🎈
   - 일상의 작은 축제 🎊
   - 맛있는 모험 🗺️
   - 기적 같은 맛 ✨
   - 행복한 충전 🔋
   - 스트레스 해소 💆‍♂️
   - 새로운 맛 시도 🆕

8. 다양한 패턴:
   - 배고파서 🍔
   - 커피가 땡겨서 ☕
   - 기분이 좋아서 😊
   - 친구랑 수다 떨고 싶어서 🗣️
   - 오후의 힐링 🌅
   - 새로운 시작 🚀
   - 작은 축하 🎊
   - 맛있는 발견 🔍

9. 완전히 새로운 아이디어:
   - 카페인 부족 🥱
   - 달콤한 유혹 🍯
   - 설레는 순간 💕
   - 기분 업그레이드 ⬆️
   - 소소한 즐거움 🎈
   - 일상의 작은 축제 🎊
   - 맛있는 모험 🗺️
   - 기적 같은 맛 ✨
   - 행복한 충전 🔋
   - 스트레스 해소 💆‍♂️
   - 새로운 맛 시도 🆕
   - 아침의 활력 🌅
   - 저녁의 여유 🌙
   - 주말의 특별함 🎈
   - 하루의 마무리 🌆
   - 새로운 하루의 시작 🌅
   - 맛있는 모험 🗺️
   - 달콤한 휴식 🍰
   - 커피 한 잔의 여유 ☕
   - 기분 좋은 하루 🌞
   - 맛있는 기적 ✨

위의 예시들을 참고하되, 매장 이름을 절대 포함하지 말고 완전히 독립적이고 창의적인 제목을 생성해주세요. "오늘의", "행복한 주문" 패턴을 사용하지 말고, 매번 다른 패턴과 아이디어를 사용해주세요.` 
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
    
    console.log('Raw Gemini response:', title)
    
    // 여러 제목이 있는 경우 첫 번째 제목만 추출
    // 줄바꿈이나 구분자로 나뉜 경우 첫 번째 것만 사용
    const lines = title.split(/[\n\r]+/).map((line: string) => line.trim()).filter((line: string) => line.length > 0)
    if (lines.length > 0) {
      title = lines[0]
    }
    
    console.log('Processed title:', title)
    
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