import type { AutoAnimateOptions } from '@formkit/auto-animate'
import type { MotionVariants } from '@vueuse/motion'

type AppMotionVariants = MotionVariants<string>

const quick = {
  type: 'spring',
  stiffness: 520,
  damping: 34,
  mass: 0.58,
}

const staticMotion = {
  initial: { opacity: 1 },
  enter: { opacity: 1, transition: { duration: 1 } },
  leave: { opacity: 1, transition: { duration: 1 } },
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useAppMotion() {
  const reduceMotion = prefersReducedMotion()
  const autoAnimateOptions: Partial<AutoAnimateOptions> = reduceMotion
    ? { duration: 1, easing: 'linear' }
    : { duration: 170, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
  const controlMotion = reduceMotion
    ? staticMotion
    : {
        initial: { opacity: 1, y: 0, scale: 1 },
        enter: { opacity: 1, y: 0, scale: 1 },
        hovered: { y: -1, scale: 1, transition: quick },
        tapped: { y: 0, scale: 0.97, transition: quick },
      }

  return {
    autoAnimateOptions,
    pageMotion: staticMotion,
    headingMotion: staticMotion,
    heroMotion: staticMotion,
    cardMotion: staticMotion,
    tileMotion: staticMotion,
    navMotion: staticMotion,
    controlMotion,
    feedbackMotion: staticMotion,
  }
}
