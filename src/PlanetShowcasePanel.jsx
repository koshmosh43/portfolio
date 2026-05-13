import { createPortal } from 'react-dom'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useAmbientGlowPointer } from './shared/hooks/useAmbientGlowPointer'
import { usePlanetPanelExclusiveVideoPlayback } from './shared/hooks/usePortfolioPanelVideoPerf'
import { gsap } from 'gsap'
import { ExternalLink } from './shared/ui/ExternalLink'
import { PanelHeader } from './shared/ui/PanelHeader'

/** File id from a Drive share link (`/file/d/<id>/…`). */
function getGoogleDriveFileId(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host !== 'drive.google.com') return null
    const m = parsed.pathname.match(/\/file\/d\/([^/]+)/)
    return m?.[1] ?? null
  } catch {
    const m = typeof url === 'string' ? url.match(/\/file\/d\/([^/]+)/) : null
    return m?.[1] ?? null
  }
}

function googleDriveStreamCandidates(fileId) {
  return [
    `https://drive.google.com/uc?export=download&id=${fileId}`,
    `https://drive.usercontent.google.com/uc?id=${fileId}&export=download`,
  ]
}

function googleDrivePreviewIframeUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`
}

/** Static frame for `<video poster>` — Drive MP4 streams often show black until first decode. */
function googleDriveVideoPosterUrl(fileId) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w960`
}

/** Pause when off-screen — AR screen captures are heavy when two decode concurrently. */
function DeckHtmlVideo({ title, preload = 'none', src, poster, videoRef, ...videoProps }) {
  const localVideoRef = useRef(null)
  const ref = videoRef ?? localVideoRef

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) el.pause()
      },
      { rootMargin: '48px', threshold: 0.04 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [ref, src])

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      playsInline
      preload={preload}
      title={title}
      {...videoProps}
    />
  )
}

/** Drive `/preview` iframe lays out its own UI — it cannot be centered with CSS; prefer `<video>` + direct stream. */
function GoogleDriveProjectVideo({ fileId, title }) {
  const [streamIndex, setStreamIndex] = useState(0)
  const [useIframe, setUseIframe] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [frameReady, setFrameReady] = useState(false)
  const videoRef = useRef(null)
  const candidates = googleDriveStreamCandidates(fileId)

  useEffect(() => {
    setFrameReady(false)
  }, [fileId, streamIndex, useIframe])

  const markFrameReady = useCallback(() => {
    setFrameReady(true)
  }, [])

  const onDrivePlayToggle = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused || video.ended) {
      void video.play().catch(() => {})
      return
    }
    video.pause()
  }, [])

  if (useIframe) {
    return (
      <ProjectMediaSlot title={title} ready={frameReady}>
        <iframe
          className="project-video-embed"
          src={googleDrivePreviewIframeUrl(fileId)}
          title={title}
          loading="lazy"
          allow="autoplay; fullscreen"
          onLoad={markFrameReady}
        />
      </ProjectMediaSlot>
    )
  }

  const src = candidates[Math.min(streamIndex, candidates.length - 1)]
  const poster = googleDriveVideoPosterUrl(fileId)

  return (
    <ProjectMediaSlot title={title} ready={frameReady}>
      <div className="project-drive-video-shell">
        <DeckHtmlVideo
          key={src}
          videoRef={videoRef}
          src={src}
          poster={poster}
          title={title}
          controls
          disablePictureInPicture
          muted
          loop
          preload="metadata"
          referrerPolicy="no-referrer"
          {...{ 'x-webkit-airplay': 'deny' }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedData={markFrameReady}
          onCanPlay={markFrameReady}
          onError={() => {
            if (streamIndex + 1 < candidates.length) setStreamIndex((i) => i + 1)
            else setUseIframe(true)
          }}
        />
        <button
          type="button"
          className={`project-drive-play-toggle ${isPlaying ? 'is-hidden' : ''}`}
          aria-label={`Play ${title}`}
          onClick={onDrivePlayToggle}
        >
          <span aria-hidden>▶</span>
        </button>
      </div>
    </ProjectMediaSlot>
  )
}

/** Drive `/view` links do not work as `<img src>`; thumbnail endpoint streams a preview image. */
function getGoogleDriveThumbnailUrl(url) {
  if (!url || typeof url !== 'string') return url
  const m = url.match(/\/file\/d\/([^/]+)/)
  const id = m?.[1]
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1200` : url
}

function getGoogleDriveFullImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  const m = url.match(/\/file\/d\/([^/]+)/)
  const id = m?.[1]
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w2400` : url
}

function getYoutubeEmbedUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    let videoId = null
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      videoId = parsed.searchParams.get('v')
      if (!videoId) {
        const parts = parsed.pathname.split('/').filter(Boolean)
        if (parts[0] === 'shorts' && parts[1]) videoId = parts[1]
      }
    } else if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0]?.split('?')[0] ?? null
    }
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
      : null
  } catch {
    return null
  }
}

function ProjectVideoPlaceholder({ title, bare = false }) {
  return (
    <div className={`project-video-placeholder${bare ? ' project-video-placeholder--bare' : ''}`} aria-hidden>
      {!bare ? <span>{title}</span> : null}
    </div>
  )
}

/** Same rim + AR-style skeleton as screenshots; fades out when `ready`. */
function ProjectMediaSlot({ title, ready, children }) {
  return (
    <div className="project-media-slot">
      {!ready ? <ProjectVideoPlaceholder title={title} bare /> : null}
      <div className={`project-media-slot__track${ready ? ' is-ready' : ''}`}>{children}</div>
    </div>
  )
}

function previewBrandFromHref(href, explicit) {
  if (explicit) return explicit
  if (!href) return 'Preview'
  try {
    const host = new URL(href).hostname.replace(/^www\./, '')
    if (host.includes('pearfiction.com')) return 'Pear Fiction'
    if (host.includes('room8studio.com') || host.includes('room8group.com')) return 'Room 8'
    if (host === 'youtube.com' || host === 'youtu.be' || host === 'm.youtube.com') return 'Gameplay'
    return 'Preview'
  } catch {
    return 'Preview'
  }
}

/** Studio key art — avoids age-gated / broken embeds while staying on-brand. */
function ProjectStudioPreview({ imageSrc, href, brand, title }) {
  const [imgReady, setImgReady] = useState(false)
  const label = `${title} — ${brand}`

  useEffect(() => {
    setImgReady(false)
  }, [imageSrc])

  return (
    <ProjectMediaSlot title={title} ready={imgReady}>
      <a
        className="project-studio-preview"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
      >
        <img
          src={imageSrc}
          alt=""
          decoding="async"
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setImgReady(true)}
          onError={() => setImgReady(true)}
        />
        <span className="project-studio-preview__shine" aria-hidden />
        <span className="project-studio-preview__meta">
          <span className="project-studio-preview__brand">{brand}</span>
          <span className="project-studio-preview__open" aria-hidden>
            ↗
          </span>
        </span>
      </a>
    </ProjectMediaSlot>
  )
}

function YoutubeProjectIframe({ embedUrl, title }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
  }, [embedUrl])

  return (
    <ProjectMediaSlot title={title} ready={ready}>
      <iframe
        className="project-video-embed"
        src={embedUrl}
        title={title}
        loading="lazy"
        onLoad={() => setReady(true)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      />
    </ProjectMediaSlot>
  )
}

/** Floating brand pill rendered on top of any media slot (video/iframe/preview). */
function ProjectPreviewBrand({ brand }) {
  if (!brand) return null
  return (
    <span className="project-studio-preview__brand project-studio-preview__brand--floating">
      {brand}
    </span>
  )
}

function ProjectVideo({ src, title, mediaReady, portfolioPreviewSrc, portfolioPreviewHref, portfolioPreviewBrand }) {
  if (portfolioPreviewSrc) {
    if (!mediaReady) return <ProjectVideoPlaceholder title={title} />
    const href = src || portfolioPreviewHref || 'https://pearfiction.com/games/'
    const brand = previewBrandFromHref(portfolioPreviewHref || src, portfolioPreviewBrand)
    return <ProjectStudioPreview imageSrc={portfolioPreviewSrc} href={href} brand={brand} title={title} />
  }
  const driveFileId = getGoogleDriveFileId(src)
  if (driveFileId) {
    if (!mediaReady) return <ProjectVideoPlaceholder title={title} />
    return <GoogleDriveProjectVideo fileId={driveFileId} title={title} />
  }
  const youtubeEmbedUrl = getYoutubeEmbedUrl(src)
  if (youtubeEmbedUrl) {
    if (!mediaReady) return <ProjectVideoPlaceholder title={title} />
    return <YoutubeProjectIframe embedUrl={youtubeEmbedUrl} title={title} />
  }
  if (!mediaReady) return <ProjectVideoPlaceholder title={title} />
  return (
    <HtmlVideoWithSkeleton src={src} title={title} />
  )
}

function HtmlVideoWithSkeleton({ src, title }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(false)
  }, [src])

  return (
    <ProjectMediaSlot title={title} ready={ready}>
      <DeckHtmlVideo
        src={src}
        title={title}
        controls
        disablePictureInPicture
        muted
        loop
        preload="none"
        onLoadedData={() => setReady(true)}
        onCanPlay={() => setReady(true)}
        onError={() => setReady(true)}
        {...{ 'x-webkit-airplay': 'deny' }}
      />
    </ProjectMediaSlot>
  )
}

/** Never clear `opacity` here — removing inline opacity after fade flashes content for one frame before unmount. */
function ArShotLightbox({ lightbox, onClosed }) {
  const rootRef = useRef(null)
  const scrimRef = useRef(null)
  const orbRef = useRef(null)
  const frameRef = useRef(null)
  const imgRef = useRef(null)
  const closeRef = useRef(null)
  const [imgFailed, setImgFailed] = useState(false)

  useEffect(() => {
    setImgFailed(false)
  }, [lightbox.fullSrc])

  const finishClose = useCallback(() => {
    onClosed()
  }, [onClosed])

  /** Mirror of intro `useLayoutEffect` timeline: same durations & start offsets, eases inverted, end state = intro initial. */
  const runClose = useCallback(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!scrimRef.current || !frameRef.current) {
      finishClose()
      return
    }
    if (reduced) {
      finishClose()
      return
    }

    if (closeRef.current) {
      gsap.killTweensOf(closeRef.current)
      gsap.set(closeRef.current, { rotation: 0, scale: 1 })
    }

    /* End time aligned with intro timeline (max ~0.78s). */
    const T = 0.78
    const tl = gsap.timeline({ onComplete: finishClose })

    tl.to(
      frameRef.current,
      {
        opacity: 0,
        scale: 0.68,
        rotateX: 14,
        y: 48,
        duration: 0.68,
        ease: 'power3.in',
        force3D: true,
      },
      T - 0.78,
    )

    if (imgRef.current && !imgFailed) {
      tl.to(
        imgRef.current,
        {
          opacity: 0,
          scale: 1.06,
          duration: 0.52,
          ease: 'power3.in',
          force3D: true,
        },
        T - 0.7,
      )
    }

    if (orbRef.current) {
      tl.to(
        orbRef.current,
        {
          opacity: 0,
          scale: 0.35,
          rotate: 18,
          duration: 0.72,
          ease: 'power3.in',
          force3D: true,
        },
        T - 0.76,
      )
    }

    if (closeRef.current) {
      tl.to(
        closeRef.current,
        { opacity: 0, y: -12, duration: 0.4, ease: 'power3.in', force3D: true },
        T - 0.5,
      )
    }

    tl.to(scrimRef.current, { opacity: 0, duration: 0.45, ease: 'power2.in', force3D: true }, T - 0.45)
  }, [finishClose, imgFailed])

  useLayoutEffect(() => {
    if (!lightbox || !rootRef.current) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let ctx = null
    let cancelled = false
    let introPlayed = false

    /** Same frame as mount — before paint — so the image never flashes at full opacity before the intro. */
    const applyIntroFromState = () => {
      if (reduced) {
        gsap.set(scrimRef.current, { opacity: 1 })
        gsap.set(orbRef.current, { opacity: 0.55, scale: 1, rotate: 0 })
        gsap.set(frameRef.current, { opacity: 1, scale: 1, rotateX: 0, y: 0 })
        if (imgRef.current) gsap.set(imgRef.current, { opacity: 1, scale: 1, force3D: true })
        gsap.set(closeRef.current, { opacity: 1, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%' })
        return
      }
      gsap.set(scrimRef.current, { opacity: 0, force3D: true })
      gsap.set(orbRef.current, { opacity: 0, scale: 0.35, rotate: 18, force3D: true })
      gsap.set(closeRef.current, {
        opacity: 0,
        y: -12,
        rotation: 0,
        scale: 1,
        transformOrigin: '50% 50%',
        force3D: true,
      })
      gsap.set(frameRef.current, {
        opacity: 0,
        scale: 0.68,
        rotateX: 14,
        y: 48,
        transformOrigin: '50% 58%',
        transformPerspective: 1400,
        force3D: true,
      })
      if (imgRef.current) {
        gsap.set(imgRef.current, { opacity: 0, scale: 1.06, force3D: true })
      }
    }

    /** Runs after decode / load — only tweens; initial state already applied synchronously. */
    const playIntroTimeline = () => {
      if (cancelled || !rootRef.current || introPlayed || reduced) return
      introPlayed = true
      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: 'power2.out', force3D: true },
        })
        tl.to(scrimRef.current, { opacity: 1, duration: 0.45 }, 0)
          .to(closeRef.current, { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, 0.1)
          .to(orbRef.current, { opacity: 0.75, scale: 1, rotate: 0, duration: 0.72, ease: 'power3.out' }, 0.04)
          .to(
            frameRef.current,
            { opacity: 1, scale: 1, rotateX: 0, y: 0, duration: 0.68, ease: 'power3.out' },
            0.1,
          )
        if (imgRef.current) {
          tl.to(
            imgRef.current,
            { opacity: 1, scale: 1, duration: 0.52, ease: 'power3.out' },
            0.18,
          )
        }
      }, rootRef)
    }

    applyIntroFromState()

    let introRafId = null
    let imgWaitEl = null
    let imgWaitHandler = null
    let imgWaitTimeout = null

    if (!reduced) {
      const scheduleIntro = () => {
        if (cancelled) return
        introRafId = requestAnimationFrame(() => {
          introRafId = null
          playIntroTimeline()
        })
      }
      const imgEl = imgRef.current
      if (imgEl && (!imgEl.complete || imgEl.naturalWidth === 0)) {
        imgWaitEl = imgEl
        imgWaitHandler = () => {
          if (!cancelled) scheduleIntro()
        }
        imgEl.addEventListener('load', imgWaitHandler, { once: true })
        imgEl.addEventListener('error', imgWaitHandler, { once: true })
        imgWaitTimeout = window.setTimeout(imgWaitHandler, 900)
      } else {
        scheduleIntro()
      }
    }

    const tweenTargets = [scrimRef.current, orbRef.current, frameRef.current, imgRef.current, closeRef.current].filter(Boolean)

    return () => {
      cancelled = true
      if (introRafId != null) cancelAnimationFrame(introRafId)
      if (imgWaitTimeout != null) window.clearTimeout(imgWaitTimeout)
      if (imgWaitEl && imgWaitHandler) {
        imgWaitEl.removeEventListener('load', imgWaitHandler)
        imgWaitEl.removeEventListener('error', imgWaitHandler)
      }
      gsap.killTweensOf(tweenTargets)
      ctx?.revert()
    }
  }, [lightbox])

  useEffect(() => {
    if (!lightbox) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') runClose()
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [lightbox, runClose])

  useEffect(() => {
    if (!lightbox || !closeRef.current) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const el = closeRef.current
    gsap.set(el, { transformOrigin: '50% 50%' })

    const onEnter = () => {
      gsap.to(el, {
        rotation: 45,
        scale: 1.07,
        duration: 0.42,
        ease: 'back.out(1.75)',
        overwrite: 'auto',
      })
    }
    const onLeave = () => {
      gsap.to(el, {
        rotation: 0,
        scale: 1,
        duration: 0.34,
        ease: 'power3.out',
        overwrite: 'auto',
      })
    }

    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      gsap.killTweensOf(el)
      gsap.set(el, { rotation: 0, scale: 1 })
    }
  }, [lightbox])

  if (!lightbox) return null

  return createPortal(
    <div
      ref={rootRef}
      className="image-lightbox-root"
      role="dialog"
      aria-modal="true"
      aria-label="Screenshot preview"
      onClick={runClose}
    >
      <div ref={scrimRef} className="image-lightbox-scrim" role="presentation" />
      <div className="image-lightbox-stage">
        <div className="image-lightbox-back" aria-hidden>
          <div ref={orbRef} className="image-lightbox-orb" />
        </div>
        <button
          ref={closeRef}
          type="button"
          className="image-lightbox-close"
          aria-label="Close preview"
        >
          ×
        </button>
        <div ref={frameRef} className="image-lightbox-frame">
          {imgFailed ? (
            <div className="image-lightbox-fallback">
              <p>Не вдалося завантажити зображення.</p>
              <p className="image-lightbox-fallback-hint">Спробуй інше посилання або відкрий файл у новій вкладці.</p>
              <a
                href={lightbox.viewUrl ?? lightbox.fullSrc}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Відкрити оригінал
              </a>
            </div>
          ) : null}
          <img
            ref={imgRef}
            src={lightbox.fullSrc}
            alt=""
            decoding="async"
            referrerPolicy="no-referrer"
            loading="eager"
            className={imgFailed ? 'image-lightbox-img is-hidden' : 'image-lightbox-img'}
            onError={() => {
              if (imgRef.current) gsap.killTweensOf(imgRef.current)
              setImgFailed(true)
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  )
}

function PlanetShowcasePanelComponent({ planetPanelId = null, showcase, onBack, enableMedia = false }) {
  const gridRef = useRef(null)
  const [shotLightbox, setShotLightbox] = useState(null)
  const [mediaReady, setMediaReady] = useState(false)
  const [carouselNav, setCarouselNav] = useState({
    touch: false,
    overflow: false,
    canPrev: false,
    canNext: false,
  })
  const preloadedShotsRef = useRef(new Set())
  const onCardAmbientMove = useAmbientGlowPointer()
  usePlanetPanelExclusiveVideoPlayback()

  useEffect(() => {
    if (!enableMedia) {
      setMediaReady(false)
      return undefined
    }
    let cancelled = false
    let idleId = 0
    let timeoutId = 0

    const commit = () => {
      if (cancelled) return
      requestAnimationFrame(() => {
        if (cancelled) return
        requestAnimationFrame(() => {
          if (!cancelled) setMediaReady(true)
        })
      })
    }

    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit()
      return () => {
        cancelled = true
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(commit, { timeout: 280 })
    } else {
      timeoutId = window.setTimeout(commit, 48)
    }

    return () => {
      cancelled = true
      if (idleId) window.cancelIdleCallback(idleId)
      if (timeoutId) window.clearTimeout(timeoutId)
    }
  }, [enableMedia, showcase])

  const preloadShot = useCallback((viewUrl) => {
    const fullSrc = getGoogleDriveFullImageUrl(viewUrl)
    if (!fullSrc || preloadedShotsRef.current.has(fullSrc)) return
    preloadedShotsRef.current.add(fullSrc)
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.src = fullSrc
    if (typeof img.decode === 'function') {
      void img.decode().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const grid = gridRef.current
    if (
      !grid ||
      !mediaReady ||
      !showcase.carousel ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return undefined

    let tween = null
    const touchUiMq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: none), (pointer: coarse)')
        : { matches: false, addEventListener: () => {}, removeEventListener: () => {} }

    const startCarousel = () => {
      if (touchUiMq.matches) {
        tween?.kill()
        tween = null
        return
      }
      const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth)
      if (maxScroll < 24) return
      tween?.kill()
      tween = gsap.to(grid, {
        scrollLeft: maxScroll,
        duration: Math.max(8, maxScroll / 85),
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }

    startCarousel()
    const onEnter = () => tween?.pause()
    const onLeave = () => tween?.resume()
    grid.addEventListener('pointerenter', onEnter)
    grid.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', startCarousel)
    touchUiMq.addEventListener('change', startCarousel)

    return () => {
      window.removeEventListener('resize', startCarousel)
      touchUiMq.removeEventListener('change', startCarousel)
      grid.removeEventListener('pointerenter', onEnter)
      grid.removeEventListener('pointerleave', onLeave)
      tween?.kill()
    }
  }, [mediaReady, showcase])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || !showcase.carousel || !mediaReady) {
      setCarouselNav({ touch: false, overflow: false, canPrev: false, canNext: false })
      return undefined
    }

    const touchUiMq =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(hover: none), (pointer: coarse)')
        : { matches: false, addEventListener: () => {}, removeEventListener: () => {} }

    const updateNav = () => {
      const touch = touchUiMq.matches
      const maxScroll = Math.max(0, grid.scrollWidth - grid.clientWidth)
      const overflow = maxScroll > 8
      const sl = grid.scrollLeft
      const canPrev = overflow && sl > 6
      const canNext = overflow && sl < maxScroll - 6
      setCarouselNav({ touch, overflow, canPrev, canNext })
    }

    updateNav()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateNav) : null
    ro?.observe(grid)
    grid.addEventListener('scroll', updateNav, { passive: true })
    window.addEventListener('resize', updateNav)
    touchUiMq.addEventListener('change', updateNav)

    return () => {
      ro?.disconnect()
      grid.removeEventListener('scroll', updateNav)
      window.removeEventListener('resize', updateNav)
      touchUiMq.removeEventListener('change', updateNav)
    }
  }, [mediaReady, showcase.carousel, showcase.projects.length])

  const scrollCarouselBy = useCallback((dir) => {
    const grid = gridRef.current
    if (!grid) return
    const step = Math.max(140, Math.round(grid.clientWidth * 0.72))
    grid.scrollBy({ left: dir * step, behavior: 'smooth' })
  }, [])

  useEffect(() => {
    if (!mediaReady) return undefined
    const warmup = () => {
      const urls = showcase.projects
        .flatMap((project) => (Array.isArray(project.screenshots) ? project.screenshots : []))
        .slice(0, 4)
      urls.forEach(preloadShot)
    }
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(warmup, { timeout: 1000 })
      return () => window.cancelIdleCallback(idleId)
    }
    const timer = window.setTimeout(warmup, 250)
    return () => window.clearTimeout(timer)
  }, [mediaReady, preloadShot, showcase])

  const isArShowcase =
    showcase.projects.length > 0 &&
    showcase.projects.every((p) => {
      const n = Array.isArray(p.screenshots) ? p.screenshots.length : 0
      return n >= 1 && n <= 4
    })

  const gridClass = `planet-grid${isArShowcase ? ' planet-grid--ar-showcase' : ''}`.trim()
  const gridAria =
    showcase.carousel && carouselNav.touch && carouselNav.overflow
      ? 'Game projects. Swipe horizontally or use side arrows to browse.'
      : undefined
  const showCarouselArrows = showcase.carousel && carouselNav.touch && carouselNav.overflow

  const projectGrid = (
    <div ref={gridRef} className={gridClass} aria-label={gridAria}>
      {showcase.projects.map((project) => {
        const shotCount = Array.isArray(project.screenshots) ? project.screenshots.length : 0
        const isArMaskCard = shotCount >= 1 && shotCount <= 4
        return (
          <article
            className={`project-card ambient-glow-frame ambient-glow-frame--subtle${
              isArMaskCard ? ' project-card--ar-mask' : ''
            }`}
            key={project.title}
            onPointerMove={onCardAmbientMove}
          >
            <div className="project-card__ambient-inner">
              {isArMaskCard ? (
                <div
                  className="project-card-ar-layout"
                  style={
                    project.videoSourceSize
                      ? {
                          '--ar-video-w': project.videoSourceSize.w,
                          '--ar-video-h': project.videoSourceSize.h,
                        }
                      : { '--ar-video-w': 9, '--ar-video-h': 16 }
                  }
                >
                  <div className="project-card-preview project-card-preview--ar">
                    <ProjectVideo
                      src={project.videoUrl}
                      title={project.title}
                      mediaReady={mediaReady}
                      portfolioPreviewSrc={project.portfolioPreviewSrc}
                      portfolioPreviewHref={project.portfolioPreviewHref ?? project.linkUrl}
                      portfolioPreviewBrand={project.portfolioPreviewBrand}
                    />
                  </div>
                  <div
                    className={`project-card-screenshots${shotCount === 2 ? ' project-card-screenshots--pair' : shotCount === 1 ? ' project-card-screenshots--single' : ''}`}
                    role="list"
                    aria-label="Mask screenshots"
                  >
                    {project.screenshots.map((url, i) => {
                      if (!mediaReady) {
                        return (
                          <div
                            key={`${project.title}-shot-${i}`}
                            className="project-card-shot project-card-shot--placeholder"
                            role="listitem"
                            aria-hidden
                          />
                        )
                      }
                      return (
                        <button
                          key={`${project.title}-shot-${i}`}
                          type="button"
                          className="project-card-shot"
                          role="listitem"
                          aria-label={`${project.title} — enlarge screenshot ${i + 1} of ${shotCount}`}
                          onClick={() =>
                            setShotLightbox({
                              fullSrc: getGoogleDriveFullImageUrl(url),
                              viewUrl: url,
                              alt: `${project.title} — screenshot ${i + 1} of ${shotCount}`,
                            })
                          }
                          onPointerEnter={() => preloadShot(url)}
                          onFocus={() => preloadShot(url)}
                        >
                          <img
                            src={getGoogleDriveThumbnailUrl(url)}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="project-card-preview">
                  <ProjectVideo
                    src={project.videoUrl}
                    title={project.title}
                    mediaReady={mediaReady}
                    portfolioPreviewSrc={project.portfolioPreviewSrc}
                    portfolioPreviewHref={project.portfolioPreviewHref ?? project.linkUrl}
                    portfolioPreviewBrand={project.portfolioPreviewBrand}
                  />
                  {!project.portfolioPreviewSrc && project.portfolioPreviewBrand && mediaReady ? (
                    <ProjectPreviewBrand brand={project.portfolioPreviewBrand} />
                  ) : null}
                </div>
              )}
              <h4>{project.title}</h4>
              <p>{project.description}</p>
              {project.linkUrl ? (
                <ExternalLink className="project-card-link" href={project.linkUrl}>
                  {project.linkLabel ?? project.linkUrl}
                </ExternalLink>
              ) : null}
            </div>
          </article>
        )
      })}
    </div>
  )

  return (
    <section
      className={`planet-panel ${mediaReady ? '' : 'planet-panel--lite'} ${showcase.mediaScale === 'large' ? 'planet-panel--large-media' : ''}${
        planetPanelId ? ` planet-panel--${planetPanelId}` : ''
      }`.trim()}
    >
      {shotLightbox ? (
        <ArShotLightbox lightbox={shotLightbox} onClosed={() => setShotLightbox(null)} />
      ) : null}
      <PanelHeader
        title={showcase.title}
        subtitle={showcase.subtitle}
        actionLabel="Back to galaxy"
        onAction={onBack}
      />
      {showcase.carousel ? (
        <div className="planet-panel-carousel-shell">
          {showCarouselArrows ? (
            <>
              <button
                type="button"
                className={`planet-carousel-nav planet-carousel-nav--prev${carouselNav.canPrev ? '' : ' is-disabled'}`}
                aria-label="Previous projects"
                aria-disabled={!carouselNav.canPrev}
                disabled={!carouselNav.canPrev}
                onClick={() => scrollCarouselBy(-1)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                  <path
                    d="M14 7 L9 12 L14 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                className={`planet-carousel-nav planet-carousel-nav--next${carouselNav.canNext ? '' : ' is-disabled'}`}
                aria-label="Next projects"
                aria-disabled={!carouselNav.canNext}
                disabled={!carouselNav.canNext}
                onClick={() => scrollCarouselBy(1)}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                  <path
                    d="M10 7 L15 12 L10 17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          ) : null}
          {projectGrid}
        </div>
      ) : (
        projectGrid
      )}
    </section>
  )
}

export const PlanetShowcasePanel = memo(PlanetShowcasePanelComponent)
