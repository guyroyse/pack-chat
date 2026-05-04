export const MESSAGE_ID_LENGTH = 8

/**
 * PackChat Message ID class
 *
 * Represents a unique 64-bit message identifier.
 *
 * Format:
 * - Upper 48 bits: milliseconds since Unix epoch (timestamp)
 * - Lower 16 bits: random value
 *
 * This provides:
 * - Time-based ordering
 * - Uniqueness through random component
 * - ~8900 years of timestamp space (2^48 milliseconds)
 *
 * Encoding:
 * - 8 bytes, big-endian uint64
 */
export class PackChatMessageId {
  #timestamp: number
  #random: number

  /**
   * Create a new message ID
   *
   * @param timestamp Milliseconds since Unix epoch (48 bits max). Defaults to Date.now()
   * @param random Random value (16 bits max). Defaults to crypto random
   */
  constructor(timestamp?: number, random?: number) {
    this.#timestamp = timestamp ?? Date.now()
    this.#random = random ?? this.#generateRandom()

    this.#validate()
  }

  /** Timestamp component (milliseconds since Unix epoch) */
  get timestamp(): number {
    return this.#timestamp
  }

  /** Random component (16-bit value) */
  get random(): number {
    return this.#random
  }

  /**
   * Get message ID as 64-bit BigInt value
   *
   * @returns Combined timestamp and random as uint64
   */
  get value(): bigint {
    const timestampBig = BigInt(this.#timestamp) << 16n
    const randomBig = BigInt(this.#random)
    return timestampBig | randomBig
  }

  /**
   * Encode message ID to 8 bytes (big-endian)
   *
   * @returns 8-byte Uint8Array
   */
  encode(): Uint8Array {
    const buffer = new Uint8Array(MESSAGE_ID_LENGTH)
    const view = new DataView(buffer.buffer)

    // Write as big-endian uint64
    view.setBigUint64(0, this.value, false)

    return buffer
  }

  /**
   * Decode message ID from 8 bytes
   *
   * @param buffer Buffer containing 8-byte message ID
   * @returns Decoded PackChatMessageId instance
   * @throws Error if buffer too short
   */
  static decode(buffer: Uint8Array): PackChatMessageId {
    if (buffer.length < MESSAGE_ID_LENGTH)
      throw new Error(`Buffer too small for message ID: expected ${MESSAGE_ID_LENGTH} bytes, got ${buffer.length}.`)

    const view = new DataView(buffer.buffer, buffer.byteOffset, MESSAGE_ID_LENGTH)
    const value = view.getBigUint64(0, false) // big-endian

    // Extract timestamp (upper 48 bits) and random (lower 16 bits)
    const timestamp = Number(value >> 16n)
    const random = Number(value & 0xffffn)

    return new PackChatMessageId(timestamp, random)
  }

  /**
   * Generate a random 16-bit value
   *
   * @returns Random value in range [0, 65535]
   */
  #generateRandom(): number {
    const buffer = new Uint16Array(1)
    crypto.getRandomValues(buffer)
    return buffer[0]
  }

  /**
   * Validate timestamp and random values
   *
   * @throws Error if values out of range
   */
  #validate(): void {
    // Timestamp must fit in 48 bits
    const MAX_TIMESTAMP = 0xffffffffffff
    if (this.#timestamp < 0 || this.#timestamp > MAX_TIMESTAMP)
      throw new Error(
        `Timestamp must fit in 48 bits (0 to 0x${MAX_TIMESTAMP.toString(16)}), got 0x${this.#timestamp.toString(16)}.`
      )

    // Random must fit in 16 bits
    const MAX_RANDOM = 0xffff
    if (this.#random < 0 || this.#random > MAX_RANDOM)
      throw new Error(
        `Random value must fit in 16 bits (0 to 0x${MAX_RANDOM.toString(16)}), got 0x${this.#random.toString(16)}.`
      )
  }
}
