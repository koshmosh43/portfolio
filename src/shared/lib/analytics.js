import posthog from 'posthog-js'

const isDev = import.meta.env.DEV
const devAnalytics = import.meta.env.VITE_ANALYTICS_DEV === 'true'
const key = import.meta.env.VITE_POSTHOG_KEY
const host = import.meta.env.VITE_POSTHOG_HOST

let ready = false

export function initAnalytics() {
  if ((!devAnalytics && isDev) || !key || navigator.doNotTrack === '1') return
  posthog.init(key, {
    api_host: host || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: true,
    persistence: 'localStorage+cookie',
  })
  const params = new URLSearchParams(location.search)
  const source = params.get('utm_source')
  if (source) posthog.register({ recruiter_source: source, utm_campaign: params.get('utm_campaign') })
  ready = true
}

const capture = (event, props) => ready && posthog.capture(event, props)

export const trackPlanetView = (planetId, title) => capture('planet_viewed', { planet_id: planetId, planet_title: title })
export const trackSunEasterEgg = () => capture('sun_easter_egg')
