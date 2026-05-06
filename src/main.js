import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import './style.css'
import App from './App.vue'
import en from './locales/en.json'
import pl from './locales/pl.json'

function polishPluralRule(choice, choicesLength) {
  const n = Math.abs(choice)
  if (n === 0) return 0
  if (n === 1) return 1

  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return choicesLength < 3 ? 1 : 2
  }

  return choicesLength < 4 ? 2 : 3
}

const i18n = createI18n({
  legacy: false,
  locale: 'pl',
  fallbackLocale: 'en',
  pluralRules: {
    pl: polishPluralRule,
  },
  messages: {
    en,
    pl,
  },
})

createApp(App).use(i18n).mount('#app')
