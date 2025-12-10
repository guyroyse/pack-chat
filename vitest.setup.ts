expect.extend({
  toBeTrue(received: boolean) {
    return {
      pass: received === true,
      message: () => `Expected ${received} to be true`
    }
  },
  toBeFalse(received: boolean) {
    return {
      pass: received === false,
      message: () => `Expected ${received} to be false`
    }
  }
})
