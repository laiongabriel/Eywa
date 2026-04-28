import { useSettings } from '../contexts/SettingsContext'
import { getT } from '../lib/i18n'

export function useT() {
  const { language } = useSettings()
  return getT(language)
}
