#!/usr/bin/env node

/**
 * Weekly analytics digest: PostHog -> Telegram (HogQL).
 *
 * Loads `.env` when present (does not override existing env — CI secrets win).
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadDotEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const k = trimmed.slice(0, eq).trim()
      let v = trimmed.slice(eq + 1).trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (process.env[k] === undefined) process.env[k] = v
    }
  } catch {
    /* no .env */
  }
}

loadDotEnv()

const {
  POSTHOG_PERSONAL_API_KEY: PH_KEY,
  POSTHOG_PROJECT_ID: PH_PROJECT,
  POSTHOG_HOST: PH_HOST = 'https://us.i.posthog.com',
  TELEGRAM_BOT_TOKEN: TG_TOKEN,
  TELEGRAM_CHAT_ID: TG_CHAT,
} = process.env

if (!PH_KEY || !PH_PROJECT || !TG_TOKEN || !TG_CHAT) {
  console.error('Missing required env vars')
  process.exit(1)
}

const DAYS = 7

async function phRun(body) {
  const res = await fetch(`${PH_HOST}/api/projects/${PH_PROJECT}/query/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${PH_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`PostHog ${res.status}: ${await res.text()}`)
  return res.json()
}

async function hogql(sql) {
  return phRun({
    query: { kind: 'HogQLQuery', query: sql },
  })
}

function cell(data, row = 0, col = 0) {
  const v = data?.results?.[row]?.[col]
  if (typeof v === 'number' && Number.isFinite(v)) return v
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

async function fetchPageviews() {
  const q = `
    SELECT count()
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= now() - INTERVAL ${DAYS} DAY
  `
  const data = await hogql(q)
  return Math.round(cell(data))
}

async function fetchUniqueVisitors() {
  const q = `
    SELECT uniq(distinct_id)
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= now() - INTERVAL ${DAYS} DAY
  `
  const data = await hogql(q)
  return Math.round(cell(data))
}

async function fetchMedianEngagementSeconds() {
  try {
    const q = `
      SELECT quantile(0.5)(duration)
      FROM sessions
      WHERE session_min_timestamp >= now() - INTERVAL ${DAYS} DAY
    `
    const data = await hogql(q)
    const s = cell(data)
    return s > 0 ? Math.round(s) : null
  } catch {
    return null
  }
}

async function fetchPlanetViews() {
  const q = `
    SELECT properties.planet_title, count() AS c
    FROM events
    WHERE event = 'planet_viewed'
      AND timestamp >= now() - INTERVAL ${DAYS} DAY
    GROUP BY properties.planet_title
    ORDER BY c DESC
    LIMIT 12
  `
  const data = await hogql(q)
  return (data?.results ?? []).map(([title, count]) => ({
    title: title || '—',
    count: Math.round(Number(count) || 0),
  }))
}

async function fetchTopCountries() {
  const q = `
    SELECT properties.\`$geoip_country_name\` AS country, uniq(distinct_id) AS u
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= now() - INTERVAL ${DAYS} DAY
      AND properties.\`$geoip_country_name\` IS NOT NULL
      AND properties.\`$geoip_country_name\` != ''
    GROUP BY country
    ORDER BY u DESC
    LIMIT 5
  `
  const data = await hogql(q)
  return (data?.results ?? []).map(([country, count]) => ({
    country: country || 'Unknown',
    count: Math.round(Number(count) || 0),
  }))
}

async function fetchTopUtm() {
  const q = `
    SELECT properties.utm_source, properties.utm_campaign, count() AS c
    FROM events
    WHERE event = '$pageview'
      AND timestamp >= now() - INTERVAL ${DAYS} DAY
      AND properties.utm_source IS NOT NULL
      AND properties.utm_source != ''
    GROUP BY properties.utm_source, properties.utm_campaign
    ORDER BY c DESC
    LIMIT 5
  `
  const data = await hogql(q)
  return (data?.results ?? []).map(([src, campaign, count]) => ({
    src,
    campaign,
    count: Math.round(Number(count) || 0),
  }))
}

function buildMessage({ pageviews, uniques, medianSec, planets, countries, utm }) {
  const lines = [
    `📊 Portfolio — ${DAYS}-day digest`,
    '',
    `👁 Pageviews: ${pageviews}`,
    `👤 Unique visitors: ${uniques}`,
  ]

  if (medianSec != null) {
    lines.push(`⏱️ Sessions ~median length: ${medianSec}s`)
  }

  if (planets.length) {
    lines.push('', '🪐 Planets:')
    for (const p of planets) lines.push(`  • ${p.title}: ${p.count}`)
  }

  if (countries.length) {
    lines.push('', '🌍 Top regions:')
    for (const c of countries) lines.push(`  • ${c.country}: ${c.count}`)
  }

  if (utm.length) {
    lines.push('', '🔗 UTM:')
    for (const u of utm) lines.push(`  • ${u.src} / ${u.campaign}: ${u.count}`)
  }

  if (!pageviews && !uniques) {
    lines.push(
      '',
      '⚠️ Нульові метрики: найчастіше на проді не було зібраного ключа PostHog.',
      '→ Repo → Settings → Secrets → додайте VITE_POSTHOG_KEY і зробіть новий деплой Pages.',
      '→ Карта кліків і карта світу — у веб PostHog (Heatmaps / Maps), не в Telegram.',
    )
  }

  return lines.join('\n')
}

async function sendTelegram(text) {
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT, text }),
  })
  if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`)
}

const [pageviews, uniques, medianSec, planets, countries, utm] = await Promise.all([
  fetchPageviews(),
  fetchUniqueVisitors(),
  fetchMedianEngagementSeconds(),
  fetchPlanetViews(),
  fetchTopCountries(),
  fetchTopUtm(),
])

const msg = buildMessage({ pageviews, uniques, medianSec, planets, countries, utm })
console.log(msg)
await sendTelegram(msg)
console.log('Digest sent to Telegram ✓')
