/**
 * AX.25 Frame Encoder (Simplified for PackChat)
 *
 * Encodes AX.25 UI frames with hardcoded control (0x03) and PID (0xF0)
 * No repeater support - local-only communication
 */

import { AX25_Address } from './ax25-address'
import { AX25_Callsign, AX25_SSID } from './ax25-types'

/**
 * Encode an AX.25 UI frame into bytes
 *
 * Hardcodes:
 * - Control field: 0x03 (UI frame)
 * - PID: 0xF0 (no layer 3)
 * - No repeaters (local-only)
 *
 * @param destination Destination address
 * @param source Source address
 * @param info Information field payload
 * @returns Buffer ready to wrap in KISS frame
 */
export function encodeAX25_Frame(callsign: AX25_Callsign, ssid: AX25_SSID, info: Buffer): Buffer {
  // Calculate total frame size: dest(7) + source(7) + control(1) + pid(1) + info
  const totalLength = 7 + 7 + 1 + 1 + info.length

  // Build frame
  const buffer = Buffer.alloc(totalLength)
  let offset = 0

  // Destination address (extension bit = 0, not last)
  const destWithExtBit = new AX25_Address('APCHAT', 0, false)
  destWithExtBit.encode().copy(buffer, offset)
  offset += 7

  // Source address (extension bit = 1, last address since no repeaters)
  const sourceWithExtBit = new AX25_Address(callsign, ssid, true)
  sourceWithExtBit.encode().copy(buffer, offset)
  offset += 7

  // Control field (UI frame)
  buffer[offset++] = 0x03

  // PID (no layer 3)
  buffer[offset++] = 0xf0

  // Info field
  info.copy(buffer, offset)

  return buffer
}
