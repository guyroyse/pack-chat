import 'vitest'

export {}

declare module 'vitest' {
  interface Assertion {
    toBeTrue(): void
    toBeFalse(): void
  }

  interface AsymmetricMatchersContaining {
    toBeTrue(): void
    toBeFalse(): void
  }
}
