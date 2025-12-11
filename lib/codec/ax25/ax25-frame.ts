import { decodeAX25_Frame } from './ax25-decoder'
import { encodeAX25_Frame } from './ax25-encoder'
import { AX25_Address } from './ax25-address'
import { AX25_SSID, AX25_CommandResponse } from './ax25-types'

/**
 * AX.25 Frame class
 *
 * Represents an AX.25 packet frame with encode/decode capabilities
 *
 * AX.25 Frame Format:
 * +-------------+-------------+------------+---------+-----+-------------+
 * | Destination |   Source    | Repeaters  | Control | PID |    Info     |
 * |   7 bytes   |   7 bytes   | 0-56 bytes | 1-2 B   | 0-1 | 0-256 bytes |
 * +-------------+-------------+------------+---------+-----+-------------+
 *
 * Address Encoding (7 bytes each):
 * - Bytes 0-5: Callsign (ASCII shifted left 1 bit, space-padded)
 * - Byte 6: SSID (bits 1-4) and flags (C/R, reserved, extension)
 *
 * Example: Create a UI frame
 * const frame = new AX25_Frame(
 *   new AX25_Address('APCHAT', 0),
 *   new AX25_Address('K6ABC', 0),
 *   [],
 *   0x03,  // UI frame
 *   0xF0,  // No layer 3
 *   Buffer.from('Hello')
 * )
 */
export class AX25_Frame {
  #destination: AX25_Address
  #source: AX25_Address
  #repeaters: AX25_Address[]
  #control: number
  #pid: number | undefined
  #info: Buffer

  constructor(
    destination: AX25_Address,
    source: AX25_Address,
    repeaters: AX25_Address[],
    control: number,
    pid: number | undefined,
    info: Buffer
  ) {
    this.#destination = destination
    this.#source = source
    this.#repeaters = repeaters
    this.#control = control
    this.#pid = pid
    this.#info = info
  }

  /** Destination address (callsign + SSID) */
  get destination(): AX25_Address {
    return this.#destination
  }

  /** Source address (callsign + SSID) */
  get source(): AX25_Address {
    return this.#source
  }

  /** Digipeater path (empty for direct transmission) */
  get repeaters(): AX25_Address[] {
    return this.#repeaters
  }

  /** Control field (1 or 2 bytes) */
  get control(): number {
    return this.#control
  }

  /** Protocol ID (present if I-frame or UI-frame) */
  get pid(): number | undefined {
    return this.#pid
  }

  /** Information field payload */
  get info(): Buffer {
    return this.#info
  }

  /**
   * Encode this AX.25 frame into bytes ready for KISS wrapping
   *
   * @returns Buffer ready to wrap in KISS frame
   */
  encode(): Buffer {
    return encodeAX25_Frame(this.#destination, this.#source, this.#repeaters, this.#control, this.#pid, this.#info)
  }

  /**
   * Decode an AX.25 frame from raw bytes
   *
   * @param buffer Raw AX.25 frame bytes (from KISS)
   * @returns Decoded AX.25 frame or null if invalid
   */
  static decode(buffer: Buffer): AX25_Frame | null {
    return decodeAX25_Frame(buffer)
  }

  /**
   * Create a simple UI frame for connectionless transmission
   *
   * Uses APCHAT-0 as destination and standard UI frame control/PID values
   *
   * @param source Source callsign
   * @param sourceSSID Source SSID (0-15)
   * @param info Information field payload
   * @returns AX.25 UI frame ready to encode
   */
  static createUIFrame(source: string, sourceSSID: AX25_SSID, info: Buffer): AX25_Frame {
    return new AX25_Frame(
      new AX25_Address('APCHAT', 0 as AX25_SSID, AX25_CommandResponse.COMMAND),
      new AX25_Address(source, sourceSSID, AX25_CommandResponse.COMMAND),
      [],
      0x03, // UI frame
      0xf0, // No layer 3
      info
    )
  }
}
