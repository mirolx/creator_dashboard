'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'

/**
 * 빈 칸으로 추가를 눌렀을 때 조용히 무시하지 않도록, 폼의 첫 입력칸으로 커서를 옮기고 안내를 띄운다.
 * reject(e)는 빈 값으로 제출했을 때, clear()는 입력이 바뀔 때 부른다.
 */
export function useRequiredHint() {
  const [missing, setMissing] = useState(false)
  return {
    missing,
    reject(e: FormEvent<HTMLFormElement>) {
      setMissing(true)
      e.currentTarget.querySelector('input')?.focus()
    },
    clear() {
      if (missing) setMissing(false)
    },
  }
}

export function RequiredHint({ show, className = '' }: { show: boolean; className?: string }) {
  const t = useTranslations('common')
  if (!show) return null
  return (
    // 카드마다 배경색이 달라서(분홍·크림·검정) 빨간색 대신 카드 글자색을 따라 굵게 표시한다.
    <p role="alert" className={`text-xs font-bold ${className}`}>
      ⚠ {t('required')}
    </p>
  )
}
