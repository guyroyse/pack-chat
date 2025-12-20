import { FEND, FESC, TFEND, TFESC } from './kiss-types'

/**
 * Encode a KISS DATA_FRAME into bytes ready for transmission (Simplified for PackChat)
 *
 * Hardcodes:
 * - Port: 0
 * - Command: 0x00 (DATA_FRAME)
 *
 * Format: [FEND] [0x00] [PAYLOAD...] [FEND]
 *
 * @param payload - Frame payload (AX.25 packet data)
 * @returns Uint8Array ready to send to TNC
 */
export function encodeKISS_Frame(payload: Uint8Array): Uint8Array {
  // Escape payload bytes
  const payloadBytes = escapePayload(payload)

  // Build the frame: FEND + 0x00 + escaped_payload + FEND
  const totalLength = payloadBytes.length + 3
  const buffer = new Uint8Array(totalLength)

  buffer[0] = FEND // Frame start
  buffer[1] = 0x00 // Port 0, DATA_FRAME command
  buffer.set(payloadBytes, 2) // Escaped payload
  buffer[totalLength - 1] = FEND // Frame end

  return buffer
}

/**
 * Escape special KISS characters in payload
 *
 * - 0xC0 (FEND) -> 0xDB 0xDC (FESC + TFEND)
 * - 0xDB (FESC) -> 0xDB 0xDD (FESC + TFESC)
 */
function escapePayload(payload: Uint8Array): Uint8Array {
  const escaped: number[] = []

  for (const byte of payload) {
    if (byte === FEND) {
      escaped.push(FESC, TFEND)
    } else if (byte === FESC) {
      escaped.push(FESC, TFESC)
    } else {
      escaped.push(byte)
    }
  }

  return new Uint8Array(escaped)
}
