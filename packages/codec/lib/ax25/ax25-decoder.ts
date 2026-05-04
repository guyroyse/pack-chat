/**
 * AX.25 Frame Decoder (Simplified for PackChat)
 *
 * Parses AX.25 UI frames from byte buffers
 * Only supports UI frames (0x03) with PID 0xF0
 * No repeater support - local-only communication
 */

import { AX25_Address } from './ax25-address'
import { AX25_Frame } from './ax25-frame'

/**
 * Parse an AX.25 UI frame from a buffer
 *
 * This decoder only supports UI frames (control=0x03) with PID 0xF0.
 * No repeaters are supported.
 * It will throw an error for any other frame type.
 *
 * @param buffer Raw AX.25 frame bytes (from KISS)
 * @returns Parsed AX.25 UI frame
 * @throws Error if buffer is too small, not a UI frame, wrong PID, or has repeaters
 */
export function decodeAX25_Frame(buffer: Uint8Array): AX25_Frame {
  let offset = 0

  validateBuffer()
  const _destination = parseDestination()
  const source = parseSource()
  const _controlField = parseControl()
  const _pid = parsePID()
  const info = parseInfo()

  return new AX25_Frame(source.callsign, source.ssid, info)

  function validateBuffer() {
    // Minimum frame size: dest(7) + source(7) + control(1) + pid(1) = 16 bytes
    if (buffer.length < 16)
      throw new Error(`Invalid AX.25 frame: Too short. Expected at least 16 bytes, got ${buffer.length}.`)
  }

  function parseDestination(): AX25_Address {
    // Decode destination address (always present)
    const destination = AX25_Address.decode(buffer.subarray(offset, offset + 7))
    offset += 7

    // validate destination callsign is 'APCHAT' and SSID is 0
    if (destination.callsign !== 'APCHAT' || destination.ssid !== 0)
      throw new Error(
        `Unsupported AX.25 frame: destination address must be APCHAT-0. Got ${destination.callsign}-${destination.ssid}.`
      )

    // Validate destination last address bit should be 0 (more addresses follow)
    if (destination.lastAddress) throw new Error('Invalid AX.25 frame: destination address cannot be last.')

    return destination
  }

  function parseSource(): AX25_Address {
    // Decode source address (always present)
    const source = AX25_Address.decode(buffer.subarray(offset, offset + 7))
    offset += 7

    // Validate source last address bit should be 1 (last address, no repeaters)
    if (!source.lastAddress) throw new Error('Unsupported AX.25 frame: repeaters detected.')

    return source
  }

  function parseControl(): number {
    // read control field
    const control = buffer[offset]
    offset++

    // Validate control field (must be UI frame: 0x03)
    if (control !== 0x03) {
      const controlHex = control.toString(16).padStart(2, '0')
      throw new Error(`Unsupported AX.25 frame: Control field must be 0x03 (UI frame). Got 0x${controlHex}.`)
    }

    return control
  }

  function parsePID(): number {
    // read PID field
    const pid = buffer[offset]
    offset++

    // Validate PID (must be 0xf0: no layer 3)
    if (pid !== 0xf0) {
      const pidHex = pid.toString(16).padStart(2, '0')
      throw new Error(`Unsupported AX.25 frame: PID must be 0xf0 (no layer 3). Got 0x${pidHex}.`)
    }

    return pid
  }

  function parseInfo() {
    return buffer.subarray(offset)
  }
}
