#!/usr/bin/env node

const BASE = 'https://koshmosh43.github.io/portfolio/'
const [campaign, source = 'direct', medium = 'recruiter'] = process.argv.slice(2)

if (!campaign) {
  console.log('Usage: node scripts/utm-link.mjs "<campaign>" [source] [medium]')
  console.log('Example: node scripts/utm-link.mjs "Google Recruiter" linkedin')
  process.exit(1)
}

const url = new URL(BASE)
url.searchParams.set('utm_source', source)
url.searchParams.set('utm_medium', medium)
url.searchParams.set('utm_campaign', campaign)

console.log(url.href)
