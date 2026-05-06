export function normalizeSearchText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[łŁ]/g, 'l')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchesSearchText(text, normalizedQuery) {
  if (!normalizedQuery) return false
  return normalizeSearchText(text).includes(normalizedQuery)
}
