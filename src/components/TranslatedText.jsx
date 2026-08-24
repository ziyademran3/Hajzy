import React from 'react'
import { useTranslation } from 'react-i18next'

export default function TranslatedText({ i18nKey, values = {}, className = '', as = 'span' }) {
  const { t } = useTranslation()
  const Tag = as
  return <Tag className={className}>{t(i18nKey, values)}</Tag>
}
