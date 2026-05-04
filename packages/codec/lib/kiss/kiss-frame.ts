import { decodeKISS_Frame } from './kiss-decoder'
import { encodeKISS_Frame } from './kiss-encoder'

/**
 * KISS Frame class (Simplified for PackChat)
 *
 * Represents a KISS DATA_FRAME for sending/receiving AX.25 packets.
 *
 * IMPORTANT: This implementation only supports:
 * - DATA_FRAME command (0x00)
 * - Port 0 (single TNC)
 *
 * KISS Frame Format:
 * ╭──────┬──────┬─────────────────────────┬──────╮
 * │ FEND │ CMD  │          DATA           │ FEND │
 * ├──────┼──────┼─────────────────────────┼──────┤
 * │ 0xC0 │ 0x00 │       0-N bytes         │ 0xC0 │
 * ╰──────┴──────┴─────────────────────────┴──────╯
 *
 * Special Character Escaping (in DATA field only):
 * - 0xC0 (FEND) → 0xDB 0xDC (FESC + TFEND)
 * - 0xDB (FESC) → 0xDB 0xDD (FESC + TFESC)
 *
 * Example: data = [0x01, 0xC0, 0x02]
 * Encoded: [0xC0, 0x00, 0x01, 0xDB, 0xDC, 0x02, 0xC0]
 */
export class KISS_Frame {
  #payload: Uint8Array

  constructor(payload: Uint8Array) {
    this.#payload = payload
  }

  /** Payload of the KISS frame (AX.25 packet data) */
  get payload(): Uint8Array {
    return this.#payload
  }

  /**
   * Encode this KISS frame into bytes ready for transmission
   *
   * Format: [FEND] [0x00] [DATA...] [FEND]
   *
   * @returns Uint8Array ready to send to TNC
   */
  encode(): Uint8Array {
    return encodeKISS_Frame(this.#payload)
  }

  /**
   * Decode a KISS frame from raw bytes
   *
   * Only supports DATA_FRAME (0x00) on port 0.
   * Throws an error for any other command or port.
   *
   * @param bytes Raw bytes containing a KISS frame
   * @returns Tuple of [decoded KISS frame, remaining bytes]
   * @throws Error if not a DATA_FRAME on port 0
   */
  static decode(bytes: Uint8Array): [KISS_Frame, Uint8Array] {
    const [payload, remainder] = decodeKISS_Frame(bytes)
    return [new KISS_Frame(payload), remainder]
  }
}
