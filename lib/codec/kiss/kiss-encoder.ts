import { FEND, FESC, KISS_Command, KISS_Port, TFEND, TFESC } from './kiss-types'

/**
 * Encode a KISS frame into bytes ready for transmission
 *
 * Format: [FEND] [CMD] [PAYLOAD...] [FEND]
 *
 * @param port - KISS port number (0-15), or null for RETURN commands
 * @param command - KISS command code
 * @param payload - Frame payload
 * @returns Uint8Array ready to send to TNC
 */
export function encodeKISS_Frame(port: KISS_Port, command: KISS_Command, payload: Uint8Array): Uint8Array {
  // Construct command byte
  const portAndCommandByte = command === KISS_Command.RETURN ? 0xff : ((port ?? 0) << 4) | command

  // Escape payload bytes
  const payloadBytes = escapePayload(payload)

  // Build the frame
  const totalLength = payloadBytes.length + 3
  const buffer = new Uint8Array(totalLength)

  buffer[0] = FEND
  buffer[1] = portAndCommandByte
  buffer.set(payloadBytes, 2)
  buffer[totalLength - 1] = FEND

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
