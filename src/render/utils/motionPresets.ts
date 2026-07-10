import type { AutoAnimateOptions } from '@formkit/auto-animate'
import type { MotionVariants } from '@vueuse/motion'

type AppMotionVariants = MotionVariants<string>

const smooth = {
  type: 'spring',
  stiffness: 360,
  damping: 28,
  mass: 0.72,
}

const quick = {
  type: 'spring',
  stiffness: 480,
  damping: 32,
  mass: 0.62,
}

const fadeOnly = {
  initial: { opacity: 1 },
  enter: { opacity: 1, transition: { duration: 1 } },
  leave: { opacity: 1, transition: { duration: 1 } },
}

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function createMotionVariants(variants: AppMotionVariants): AppMotionVariants {
  return prefersReducedMotion() ? fadeOnly : variants
}

export function useAppMotion() {
  const autoAnimateOptions: Partial<AutoAnimateOptions> = prefersReducedMotion()
    ? { duration: 1, easing: 'linear' }
    : { duration: 220, easing: 'cubic-bezier(0.2, 0, 0, 1)' }

  return {
    autoAnimateOptions,
    pageMotion: createMotionVariants({
      initial: { opacity: 0, y: 16, scale: 0.985 },
      enter: { opacity: 1, y: 0, scale: 1, transition: smooth },
      leave: { opacity: 0, y: -8, scale: 0.992, transition: quick },
    }),
    headingMotion: createMotionVariants({
      initial: { opacity: 0, y: 10 },
      enter: { opacity: 1, y: 0, transition: smooth },
    }),
    heroMotion: createMotionVariants({
      initial: { opacity: 0, y: 14, scale: 0.985 },
      enter: { opacity: 1, y: 0, scale: 1, transition: smooth },
      hovered: { y: -3, scale: 1.004, transition: quick },
    }),
    cardMotion: createMotionVariants({
      initial: { opacity: 0, y: 12, scale: 0.988 },
      enter: { opacity: 1, y: 0, scale: 1, transition: smooth },
      hovered: { y: -3, scale: 1.01, transition: quick },
      tapped: { scale: 0.992, transition: quick },
    }),
    tileMotion: createMotionVariants({
      initial: { opacity: 0, y: 10, scale: 0.985 },
      enter: { opacity: 1, y: 0, scale: 1, transition: smooth },
      hovered: { y: -3, scale: 1.012, transition: quick },
      tapped: { scale: 0.985, transition: quick },
    }),
    navMotion: createMotionVariants({
      initial: { opacity: 0, x: -8 },
      enter: { opacity: 1, x: 0, transition: smooth },
      hovered: { x: 4, scale: 1.01, transition: quick },
      tapped: { scale: 0.99, transition: quick },
    }),
    controlMotion: createMotionVariants({
      initial: { opacity: 0, scale: 0.96 },
      enter: { opacity: 1, scale: 1, transition: smooth },
      hovered: { y: -1, scale: 1.035, transition: quick },
      tapped: { scale: 0.95, transition: quick },
    }),
    feedbackMotion: createMotionVariants({
      initial: { opacity: 0, y: -8, scale: 0.985 },
      enter: { opacity: 1, y: 0, scale: 1, transition: smooth },
      leave: { opacity: 0, y: -8, scale: 0.985, transition: quick },
    }),
  }
}
