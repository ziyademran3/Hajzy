import React, { useState } from 'react'
import SettingsItem from './SettingsItem'
import { FiBell, FiLock, FiGlobe } from 'react-icons/fi'

export default function SettingsExamples() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isPrivate, setIsPrivate] = useState(false)

  return (
    <div className="space-y-4 p-4">
      <SettingsItem
        icon={FiBell}
        title="الإشعارات"
        description={notificationsEnabled ? 'مفعلة' : 'متوقفة'}
        variant="toggle"
        value={notificationsEnabled}
        onToggle={setNotificationsEnabled}
      />

      <SettingsItem
        icon={FiLock}
        title="الخصوصية"
        description={isPrivate ? 'حساب خاص' : 'حساب عام'}
        variant="toggle"
        value={isPrivate}
        onToggle={setIsPrivate}
      />

      <SettingsItem
        icon={FiGlobe}
        title="اللغة"
        description="العربية"
        variant="link"
        onClick={() => alert('فتح إعدادات اللغة')}
      />
    </div>
  )
}
