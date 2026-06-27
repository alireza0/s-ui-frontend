import { useTheme } from 'vuetify'

export const themes = [
  { value: 'light', icon: 'mdi-white-balance-sunny' },
  { value: 'dark', icon: 'mdi-moon-waning-crescent' },
  { value: 'system', icon: 'mdi-laptop' },
]

export function useThemeSwitcher() {
  const theme = useTheme()

  const changeTheme = (th: string) => {
    theme.change(th)
    localStorage.setItem('theme', th)
  }

  const isActiveTheme = (th: string) => {
    return (localStorage.getItem('theme') ?? 'system') === th
  }

  return { themes, changeTheme, isActiveTheme }
}
