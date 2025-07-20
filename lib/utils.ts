import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 가격을 포맷팅하는 함수
 * - 소수점 마지막 자리의 0을 제거
 * - "원" 텍스트를 제거
 * @param price 가격 (숫자 또는 문자열)
 * @returns 포맷팅된 가격 문자열
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  
  if (isNaN(numPrice)) {
    return '0'
  }
  
  // 소수점 2자리까지 표시하되, 마지막 0은 제거
  const formatted = numPrice.toFixed(2).replace(/\.?0+$/, '')
  
  // 정수인 경우 소수점 제거
  return formatted.replace(/\.$/, '')
}
