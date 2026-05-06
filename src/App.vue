<template>
  <div class="app">
    <header class="app-header">
      <h1>{{ t('app.title') }}</h1>
      <nav class="tabs">
        <button :class="['tab', { active: tab === 'graph' }]" @click="tab = 'graph'">{{ t('app.tabs.graph') }}</button>
        <button :class="['tab', { active: tab === 'sources' }]" @click="tab = 'sources'">{{ t('app.tabs.sources') }}</button>
      </nav>
      <div class="header-tools">
        <span v-if="tab === 'graph'" class="status">
          {{ t('app.status.chunks', { count: graphData.nodes.length }, graphData.nodes.length) }}
          ·
          {{ t('app.status.links', { count: graphData.links.length }, graphData.links.length) }}
        </span>
        <div v-if="tab === 'graph'" class="search-tools">
          <label for="graph-search" class="search-label">{{ t('search.label') }}</label>
          <input
            id="graph-search"
            v-model="searchQuery"
            class="search-input"
            type="text"
            :placeholder="t('search.placeholder')"
          >
          <span v-if="normalizedSearchQuery" class="search-count">
            {{ t('search.matches', { count: searchMatchCount }, searchMatchCount) }}
          </span>
        </div>
        <div class="lang-switch" :aria-label="t('app.language.label')">
          <button
            type="button"
            :class="['lang-btn', { active: locale === 'en' }]"
            @click="setLocale('en')"
          >
            {{ t('app.language.en') }}
          </button>
          <span class="lang-separator">|</span>
          <button
            type="button"
            :class="['lang-btn', { active: locale === 'pl' }]"
            @click="setLocale('pl')"
          >
            {{ t('app.language.pl') }}
          </button>
        </div>
      </div>

    </header>

    <div v-if="tab === 'graph'" class="app-body">
      <div class="graph-pane">
        <Graph
          :data="graphData"
          :selected-slug="selectedSlug"
          :filter-query="searchQuery"
          @select="onSelect"
        />
      </div>
      <div :class="['detail-pane', { open: !!selectedSlug }]">
        <div v-if="chunkLoading" class="panel-loading">{{ t('app.loading') }}</div>
        <ChunkPanel
          v-else-if="chunk"
          :chunk="chunk"
          @navigate="selectedSlug = $event"
          @close="selectedSlug = null"
        />
        <div v-else class="empty-state">{{ t('app.emptyState') }}</div>
      </div>
    </div>

    <SourcesView v-if="tab === 'sources'" />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { graphData, getChunk } from './data/mock.js'
import Graph from './components/Graph.vue'
import ChunkPanel from './components/ChunkPanel.vue'
import SourcesView from './components/SourcesView.vue'
import { matchesSearchText, normalizeSearchText } from './utils/search.js'

const { t, locale } = useI18n()

const tab = ref('graph')
const selectedSlug = ref(null)
const chunk = ref(null)
const chunkLoading = ref(false)
const searchQuery = ref('')

const normalizedSearchQuery = computed(() => normalizeSearchText(searchQuery.value))
const searchMatchCount = computed(() => {
  if (!normalizedSearchQuery.value) return 0

  let count = 0
  for (const node of graphData.nodes) {
    if (matchesSearchText(node.title, normalizedSearchQuery.value)) count++
  }
  return count
})

function setLocale(nextLocale) {
  locale.value = nextLocale
}

function onSelect(slug) {
  selectedSlug.value = selectedSlug.value === slug ? null : slug
}

watch(selectedSlug, async (slug) => {
  if (!slug) { chunk.value = null; return }
  chunkLoading.value = true
  await new Promise(r => setTimeout(r, 80))
  chunk.value = getChunk(slug)
  chunkLoading.value = false
})
</script>
