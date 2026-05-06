<template>
  <div class="graph-wrap">
    <div ref="containerEl" class="graph-canvas" />

    <div class="graph-controls">
      <button :class="['path-btn', { active: pathModeEnabled }]" @click="togglePathMode">
        {{ t('graph.path') }}
      </button>
      <span v-if="pathModeEnabled" class="path-status">{{ pathStatusText }}</span>
    </div>

    <div v-if="showNoPathOverlay" class="graph-overlay">
      {{ t('graph.noPathFound') }}
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import ForceGraph from 'force-graph'
import { TYPE_COLORS } from '../utils/types.js'
import { matchesSearchText, normalizeSearchText } from '../utils/search.js'

const DEFAULT_COLOR = '#95a5a6'

const props = defineProps({
  data:         { type: Object, default: () => ({ nodes: [], links: [] }) },
  selectedSlug: { type: String, default: null },
  filterQuery:  { type: String, default: '' },
})
const emit = defineEmits(['select'])
const { t } = useI18n()

const containerEl = ref(null)
const pathModeEnabled = ref(false)
const pathStartSlug = ref(null)
const pathEndSlug = ref(null)

let fg = null

function nodeColor(node) {
  return TYPE_COLORS[node.type] || DEFAULT_COLOR
}

function slugOf(endpoint) {
  if (!endpoint) return null
  if (typeof endpoint === 'string') return endpoint
  if (typeof endpoint === 'object') return endpoint.slug ?? null
  return null
}

function edgeKey(a, b) {
  if (!a || !b) return null
  return a < b ? `${a}__${b}` : `${b}__${a}`
}

function linkKey(link) {
  return edgeKey(slugOf(link.source), slugOf(link.target))
}

function resetPathState() {
  pathStartSlug.value = null
  pathEndSlug.value = null
}

function requestGraphRedraw() {
  if (!fg) return
  fg.linkWidth(fg.linkWidth())
}

function togglePathMode() {
  pathModeEnabled.value = !pathModeEnabled.value
  resetPathState()
  requestGraphRedraw()
}

const adjacencyMap = computed(() => {
  const map = new Map()

  for (const node of props.data.nodes) {
    if (node?.slug) map.set(node.slug, [])
  }

  for (const link of props.data.links) {
    const source = slugOf(link.source)
    const target = slugOf(link.target)
    if (!source || !target) continue

    const key = edgeKey(source, target)
    if (!key) continue

    if (!map.has(source)) map.set(source, [])
    if (!map.has(target)) map.set(target, [])

    map.get(source).push({ slug: target, key })
    map.get(target).push({ slug: source, key })
  }

  return map
})

const pathResult = computed(() => {
  const start = pathStartSlug.value
  const end = pathEndSlug.value

  if (!pathModeEnabled.value || !start || !end) {
    return { found: false, nodeSlugs: new Set(), edgeKeys: new Set() }
  }

  if (start === end) {
    return { found: true, nodeSlugs: new Set([start]), edgeKeys: new Set() }
  }

  const adj = adjacencyMap.value
  if (!adj.has(start) || !adj.has(end)) {
    return { found: false, nodeSlugs: new Set(), edgeKeys: new Set() }
  }

  const queue = [start]
  let qIndex = 0
  const visited = new Set([start])
  const parent = new Map()

  while (qIndex < queue.length) {
    const current = queue[qIndex++]
    if (current === end) break

    for (const neighbor of adj.get(current) ?? []) {
      if (visited.has(neighbor.slug)) continue
      visited.add(neighbor.slug)
      parent.set(neighbor.slug, { prev: current, edgeKey: neighbor.key })
      queue.push(neighbor.slug)
    }
  }

  if (!visited.has(end)) {
    return { found: false, nodeSlugs: new Set(), edgeKeys: new Set() }
  }

  const nodeSlugs = new Set([end])
  const edgeKeys = new Set()
  let cursor = end
  while (cursor !== start) {
    const step = parent.get(cursor)
    if (!step) break
    edgeKeys.add(step.edgeKey)
    cursor = step.prev
    nodeSlugs.add(cursor)
  }

  return { found: true, nodeSlugs, edgeKeys }
})

const isPathSelected = computed(() => pathModeEnabled.value && !!pathStartSlug.value && !!pathEndSlug.value)
const showPathHighlight = computed(() => isPathSelected.value && pathResult.value.found)
const showNoPathOverlay = computed(() => isPathSelected.value && !pathResult.value.found)
const normalizedFilterQuery = computed(() => normalizeSearchText(props.filterQuery))
const hasFilterQuery = computed(() => !!normalizedFilterQuery.value)
const searchMatchSlugs = computed(() => {
  const matches = new Set()
  if (!hasFilterQuery.value) return matches

  for (const node of props.data.nodes) {
    if (!node?.slug) continue
    if (matchesSearchText(node.title, normalizedFilterQuery.value)) {
      matches.add(node.slug)
    }
  }

  return matches
})
const pathStatusText = computed(() => {
  if (!pathStartSlug.value) return t('graph.selectStartNode')
  if (!pathEndSlug.value) return t('graph.selectEndNode')
  return pathResult.value.found ? t('graph.pathFound') : t('graph.noPathFound')
})

function onNodeClick(node) {
  const slug = slugOf(node)
  if (!slug) return

  if (!pathModeEnabled.value) {
    emit('select', slug)
    return
  }

  if (!pathStartSlug.value || (pathStartSlug.value && pathEndSlug.value)) {
    pathStartSlug.value = slug
    pathEndSlug.value = null
  } else {
    pathEndSlug.value = slug
  }

  requestGraphRedraw()
}

onMounted(() => {
  fg = ForceGraph()(containerEl.value)
    .graphData(props.data)
    .nodeId('slug')
    .nodeLabel('title')
    .linkColor(link => {
      if (!showPathHighlight.value) return '#334455'
      return pathResult.value.edgeKeys.has(linkKey(link))
        ? '#ffd166'
        : 'rgba(51,68,85,0.2)'
    })
    .linkWidth(link => {
      if (!showPathHighlight.value) return 1
      return pathResult.value.edgeKeys.has(linkKey(link)) ? 2.5 : 1
    })
    .linkDirectionalArrowLength(3)
    .linkDirectionalArrowRelPos(1)
    .linkLabel('label')
    .backgroundColor('#1a1a2e')
    .onNodeClick(onNodeClick)
    .nodeCanvasObject((node, ctx, globalScale) => {
      const isPathNode = pathResult.value.nodeSlugs.has(node.slug)
      const isSelected = node.slug === props.selectedSlug
      const isSearchMatch = hasFilterQuery.value && searchMatchSlugs.value.has(node.slug)
      const dimByPath = showPathHighlight.value && !isPathNode && !isSelected && !isSearchMatch
      const dimBySearch = !showPathHighlight.value && hasFilterQuery.value && !isSelected && !isSearchMatch
      ctx.globalAlpha = dimByPath || dimBySearch ? 0.2 : 1

      const color = nodeColor(node)
      const r = isSelected ? 7 : isPathNode || isSearchMatch ? 5 : 4

      ctx.beginPath()
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()

      if (showPathHighlight.value && isPathNode) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffd166'
        ctx.lineWidth = 2
        ctx.stroke()
      }

      if (isSelected) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 1.5
        ctx.stroke()
      } else if (isSearchMatch && !isPathNode) {
        ctx.beginPath()
        ctx.arc(node.x, node.y, r + 2.5, 0, 2 * Math.PI)
        ctx.strokeStyle = '#7db3f7'
        ctx.lineWidth = 1.25
        ctx.stroke()
      }

      if (globalScale >= 1.2) {
        const fontSize = Math.min(12 / globalScale, 3)
        ctx.font = `${fontSize}px Sans-Serif`
        ctx.fillStyle = 'rgba(220,220,220,0.85)'
        ctx.textAlign = 'center'
        ctx.fillText(node.title, node.x, node.y + r + fontSize + 1)
      }

      ctx.globalAlpha = 1
    })
    .nodeCanvasObjectMode(() => 'replace')

  const { width, height } = containerEl.value.getBoundingClientRect()
  if (width && height) fg.width(width).height(height)

  const ro = new ResizeObserver(([e]) => {
    fg?.width(e.contentRect.width).height(e.contentRect.height)
  })
  ro.observe(containerEl.value)
  onUnmounted(() => ro.disconnect())
})

onUnmounted(() => {
  fg?.pauseAnimation()
  fg = null
})

watch(() => props.data, d => {
  fg?.graphData(d)
  requestGraphRedraw()
})

watch([pathModeEnabled, pathStartSlug, pathEndSlug], () => requestGraphRedraw())
watch(() => props.filterQuery, () => requestGraphRedraw())

watch(() => props.selectedSlug, slug => {
  if (!slug || !fg) return
  const node = fg.graphData().nodes.find(n => n.slug === slug)
  if (node?.x != null) fg.centerAt(node.x, node.y, 400)
})
</script>

<style scoped>
.graph-wrap {
  width: 100%;
  height: 100%;
  position: relative;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.graph-controls {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 2;
}

.path-btn {
  background: #0f2a4a;
  border: 1px solid #2a5080;
  color: #d0d0d0;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}

.path-btn:hover { background: #1a3a6a; }
.path-btn.active {
  background: #5a2e0a;
  border-color: #e67e22;
  color: #f0a060;
}

.path-status {
  font-size: 12px;
  color: #ccc;
}

.graph-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  background: rgba(10, 24, 48, 0.9);
  border: 1px solid #2a5080;
  border-radius: 6px;
  padding: 8px 12px;
  color: #f0a060;
  font-size: 12px;
}
</style>
