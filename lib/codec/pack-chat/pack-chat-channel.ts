import { PackChatChannelName } from './types'

export const CHANNEL_NAME_LENGTH = 7

/**
 * PackChat Channel class
 *
 * Represents a validated PackChat channel name.
 *
 * Channel name rules:
 * - 1-7 characters
 * - Lowercase letters (a-z), numbers (0-9), hyphens (-)
 * - Must start with a letter (a-z)
 * - Must end with a letter or number (not hyphen)
 * - Examples: 'general', 'cq', 'newbie', 'dev-2', 'ham-net'
 *
 * Encoding:
 * - 7 bytes ASCII
 * - Right-padded with spaces (0x20)
 */
export class PackChatChannel {
  #name: PackChatChannelName

  constructor(name: PackChatChannelName) {
    this.#validate(name)
    this.#name = name
  }

  /** Channel name (1-7 characters, validated) */
  get name(): PackChatChannelName {
    return this.#name
  }

  /**
   * Encode the channel name to 7 bytes
   *
   * @returns 7-byte Uint8Array with right-padding
   */
  encode(): Uint8Array {
    const buffer = new Uint8Array(CHANNEL_NAME_LENGTH)
    buffer.fill(0x20) // Fill with spaces

    for (let i = 0; i < this.#name.length; i++) {
      buffer[i] = this.#name.charCodeAt(i)
    }

    return buffer
  }

  /**
   * Decode a channel name from 7 bytes
   *
   * @param buffer Buffer containing 7-byte channel name
   * @returns Decoded PackChatChannel instance
   * @throws Error if buffer too short or name invalid
   */
  static decode(buffer: Uint8Array): PackChatChannel {
    if (buffer.length < CHANNEL_NAME_LENGTH)
      throw new Error(`Buffer too small for channel name: expected ${CHANNEL_NAME_LENGTH} bytes, got ${buffer.length}.`)

    // Extract 7 bytes and convert to string
    const nameBytes = buffer.slice(0, CHANNEL_NAME_LENGTH)
    const decoder = new TextDecoder('ascii')
    const name = decoder.decode(nameBytes).trimEnd()

    // Validate and return (constructor will throw if invalid)
    return new PackChatChannel(name)
  }

  /**
   * Validate channel name according to PackChat rules
   *
   * @param name Channel name to validate
   * @throws Error if name is invalid
   */
  #validate(name: string): void {
    // Check empty
    if (name.length === 0) throw new Error('Channel name cannot be empty.')

    // Check too long
    if (name.length > CHANNEL_NAME_LENGTH)
      throw new Error(`Channel name cannot exceed ${CHANNEL_NAME_LENGTH} characters, got ${name.length}.`)

    // Check pattern: must start with letter, end with letter/number, contain only a-z0-9-
    const validPattern = /^[a-z]([a-z0-9-]*[a-z0-9])?$/
    if (!validPattern.test(name))
      throw new Error(
        'Channel name must start with a letter, end with a letter or number, and contain only lowercase letters, numbers, and hyphens.'
      )
  }
}
