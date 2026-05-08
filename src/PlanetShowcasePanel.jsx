import { createPortal } from 'react-dom'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
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

/** Drive `/preview` iframe lays out its own UI — it cannot be centered with CSS; prefer `<video>` + direct stream. */
function GoogleDriveProjectVideo({ fileId, title }) {
  const [streamIndex, setStreamIndex] = useState(0)
  const [useIframe, setUseIframe] = useState(false)
  const candidates = googleDriveStreamCandidates(fileId)

  if (useIframe) {
    return (
      <iframe
        className="project-video-embed"
        src={googleDrivePreviewIframeUrl(fileId)}
        title={title}
        loading="lazy"
        allow="autoplay; fullscreen"
      />
    )
  }

  const src = candidates[Math.min(streamIndex, candidates.length - 1)]
  return (
    <video
      key={src}
      src={src}
      title={title}
      controls
      disablePictureInPicture
      muted
      loop
      playsInline
      preload="metadata"
      referrerPolicy="no-referrer"
      {...{ 'x-webkit-airplay': 'deny' }}
      onError={() => {
        if (streamIndex + 1 < candidates.length) setStreamIndex((i) => i + 1)
        else setUseIframe(true)
      }}
    />
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

function ProjectVideo({ src, title }) {
  const driveFileId = getGoogleDriveFileId(src)
  if (driveFileId) {
    return <GoogleDriveProjectVideo fileId={driveFileId} title={title} />
  }
  const youtubeEmbedUrl = getYoutubeEmbedUrl(src)
  if (youtubeEmbedUrl) {
    return (
      <iframe
        className="project-video-embed"
        src={youtubeEmbedUrl}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
      />
    )
  }
  return (
    <video
      src={src}
      title={title}
      controls
      disablePictureInPicture
      muted
      loop
      playsInline
      preload="none"
      {...{ 'x-webkit-airplay': 'deny' }}
    />
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
              <p>Не вдалося завантажити прев’ю з Google Drive.</p>
              <p className="image-lightbox-fallback-hint">Перевір доступ «Anyone with the link», або відкрий файл напряму.</p>
              <a
                href={lightbox.viewUrl ?? lightbox.fullSrc}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Відкрити в Drive
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

function PlanetShowcasePanelComponent({ showcase, onBack }) {
  const gridRef = useRef(null)
  const [shotLightbox, setShotLightbox] = useState(null)
  const preloadedShotsRef = useRef(new Set())

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
      !showcase.carousel ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
      return undefined

    let tween = null
    const startCarousel = () => {
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

    return () => {
      window.removeEventListener('resize', startCarousel)
      grid.removeEventListener('pointerenter', onEnter)
      grid.removeEventListener('pointerleave', onLeave)
      tween?.kill()
    }
  }, [showcase])

  useEffect(() => {
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
  }, [preloadShot, showcase])

  return (
    <section className="planet-panel">
      {shotLightbox ? (
        <ArShotLightbox lightbox={shotLightbox} onClosed={() => setShotLightbox(null)} />
      ) : null}
      <PanelHeader
        title={showcase.title}
        subtitle={showcase.subtitle}
        actionLabel="Back to galaxy"
        onAction={onBack}
      />
      <div className="planet-grid" ref={gridRef}>
        {showcase.projects.map((project) => {
          const shotCount = Array.isArray(project.screenshots) ? project.screenshots.length : 0
          const isArMaskCard = shotCount >= 2 && shotCount <= 4
          return (
            <article
              className={`project-card${isArMaskCard ? ' project-card--ar-mask' : ''}`}
              key={project.title}
            >
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
                  <div
                    className="project-card-preview project-card-preview--ar"
                  >
                    <ProjectVideo src={project.videoUrl} title={project.title} />
                  </div>
                  <div
                    className={`project-card-screenshots${shotCount === 2 ? ' project-card-screenshots--pair' : ''}`}
                    role="list"
                    aria-label="Mask screenshots"
                  >
                    {project.screenshots.map((url, i) => (
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
                    ))}
                  </div>
                </div>
              ) : (
                <div className="project-card-preview">
                  <ProjectVideo src={project.videoUrl} title={project.title} />
                </div>
              )}
              <h4>{project.title}</h4>
              <p>{project.description}</p>
              {project.linkUrl ? (
                <ExternalLink className="project-card-link" href={project.linkUrl}>
                  {project.linkLabel ?? project.linkUrl}
                </ExternalLink>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}

export const PlanetShowcasePanel = memo(PlanetShowcasePanelComponent)
