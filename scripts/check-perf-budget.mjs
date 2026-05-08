import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'

const distAssets = new URL('../dist/assets/', import.meta.url)

const budgets = {
  indexBundleKb: 190,
  threeBundleKb: 760,
}

function toKb(bytes) {
  return bytes / 1024
}

const files = await readdir(distAssets)
const indexFile = files.find((name) => name.startsWith('index-') && name.endsWith('.js'))
const threeFile = files.find((name) => name.startsWith('three-') && name.endsWith('.js'))

if (!indexFile || !threeFile) {
  throw new Error('Expected index-* and three-* bundles after build.')
}

const [indexStats, threeStats] = await Promise.all([
  stat(join(distAssets.pathname, indexFile)),
  stat(join(distAssets.pathname, threeFile)),
])

const indexKb = toKb(indexStats.size)
const threeKb = toKb(threeStats.size)

if (indexKb > budgets.indexBundleKb) {
  throw new Error(`index bundle budget exceeded: ${indexKb.toFixed(2)}KB > ${budgets.indexBundleKb}KB`)
}

if (threeKb > budgets.threeBundleKb) {
  throw new Error(`three bundle budget exceeded: ${threeKb.toFixed(2)}KB > ${budgets.threeBundleKb}KB`)
}

console.log(`index bundle: ${indexKb.toFixed(2)}KB <= ${budgets.indexBundleKb}KB`)
console.log(`three bundle: ${threeKb.toFixed(2)}KB <= ${budgets.threeBundleKb}KB`)
