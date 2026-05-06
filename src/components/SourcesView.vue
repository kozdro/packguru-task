<!--
  Task 1 — Refactoring:
    • fmtTime() is duplicated here, in ChunkPanel.vue, and in PartPanel.vue.
      Extract to src/utils/format.js and import it.
-->
<template>
  <div class="app-body">
    <div class="sources-view">
      <div class="sources-header">{{ t('sourcesView.sourceFiles', { count: sources.length }, sources.length) }}</div>
      <div class="sources-list">
        <div v-for="s in sources" :key="s.source_name" class="source-card">
          <button class="source-card-header" @click="toggle(s.source_name)">
            <div class="source-card-title">
              <span class="source-card-name">{{ s.source_name }}</span>
              <span class="source-card-meta">
                {{ t('sourcesView.parts', { count: s.source_part_count }, s.source_part_count) }}
                <template v-if="s.processor"> · {{ s.processor }} {{ s.processor_version }}</template>
                · {{ fmtDate(s.processed_at) }}
              </span>
            </div>
            <span class="source-card-chevron">{{ expanded[s.source_name] ? '▲' : '▼' }}</span>
          </button>

          <div v-if="expanded[s.source_name]" class="source-card-body">
            <div class="source-meta-grid">
              <template v-if="s.source_path">
                <span class="meta-label">{{ t('sourcesView.meta.path') }}</span>
                <span class="meta-value">{{ s.source_path }}</span>
              </template>
              <template v-if="s.source_sha256">
                <span class="meta-label">{{ t('sourcesView.meta.sha256') }}</span>
                <span class="meta-value mono">{{ s.source_sha256 }}</span>
              </template>
            </div>

            <table v-if="s.parts.length" class="parts-table">
              <thead>
                <tr>
                  <th>{{ t('sourcesView.table.index') }}</th>
                  <th>{{ t('sourcesView.table.title') }}</th>
                  <th>{{ t('sourcesView.table.start') }}</th>
                  <th>{{ t('sourcesView.table.end') }}</th>
                  <th>{{ t('sourcesView.table.duration') }}</th>
                  <th>{{ t('sourcesView.table.lang') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="p in s.parts"
                  :key="p.part_index"
                  :class="['part-row', { selected: isPartSelected(s.source_name, p.part_index) }]"
                  @click="selectPart(s.source_name, p.part_index)"
                >
                  <td class="mono">{{ p.part_index }}</td>
                  <td>{{ p.title }}</td>
                  <td class="mono">{{ fmtTime(p.start_seconds) ?? t('common.notAvailable') }}</td>
                  <td class="mono">{{ fmtTime(p.end_seconds) ?? t('common.notAvailable') }}</td>
                  <td class="mono">{{ fmtTime(p.duration_seconds) ?? t('common.notAvailable') }}</td>
                  <td>{{ p.language ?? t('common.notAvailable') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div :class="['detail-pane', { open: !!selectedPart }]">
      <div v-if="partLoading" class="panel-loading">{{ t('app.loading') }}</div>
      <PartPanel
        v-else-if="partData"
        :part="partData"
        @close="selectedPart = null"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { sources, getPart } from '../data/mock.js'
import PartPanel from './PartPanel.vue'
import { fmtTime } from '../utils/format.js'

const { t } = useI18n()

function fmtDate(iso) {
  if (!iso) return t('common.notAvailable')
  return new Date(iso).toLocaleString()
}

const expanded    = ref({})
const selectedPart = ref(null)
const partData    = ref(null)
const partLoading = ref(false)

function toggle(name) {
  expanded.value[name] = !expanded.value[name]
}

function isPartSelected(sourceName, partIndex) {
  return selectedPart.value?.source_name === sourceName
    && selectedPart.value?.part_index === partIndex
}

function selectPart(sourceName, partIndex) {
  if (isPartSelected(sourceName, partIndex)) {
    selectedPart.value = null
  } else {
    selectedPart.value = { source_name: sourceName, part_index: partIndex }
  }
}

watch(selectedPart, async (sp) => {
  if (!sp) { partData.value = null; return }
  partLoading.value = true
  await new Promise(r => setTimeout(r, 80))
  partData.value = getPart(sp.source_name, sp.part_index)
  partLoading.value = false
})
</script>
