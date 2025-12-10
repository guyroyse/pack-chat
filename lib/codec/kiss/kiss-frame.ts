import { decodeKISS_Frame } from './kiss-decoder'
import { encodeKISS_Frame } from './kiss-encoder'
import { KISS_Command, KISS_Port } from './kiss-types'

/**
 * KISS Frame class
 *
 * Represents a KISS protocol frame with encode/decode capabilities
 *
 * KISS Frame Format:
 * +------+---------+-----------------------+------+
 * | FEND |   CMD   |         DATA          | FEND |
 * | 0xC0 | 1 byte  |    0-N bytes          | 0xC0 |
 * +------+---------+-----------------------+------+
 *
 * CMD Byte Structure:
 * +-----------------+------------------+
 * |   Port (0-15)   |  Command (0-15)  |
 * |   bits 7-4      |    bits 3-0      |
 * +-----------------+------------------+
 *
 * Special Character Escaping (in DATA field only):
 * - 0xC0 (FEND) -> 0xDB 0xDC (FESC + TFEND)
 * - 0xDB (FESC) -> 0xDB 0xDD (FESC + TFESC)
 *
 * Example: Port 0, DATA_FRAME command, data = [0x01, 0xC0, 0x02]
 * Encoded: [0xC0, 0x00, 0x01, 0xDB, 0xDC, 0x02, 0xC0]
 */
export class KISS_Frame {
  #port: KISS_Port
  #command: KISS_Command
  #payload: Uint8Array

  constructor(port: KISS_Port, command: KISS_Command, payload: Uint8Array) {
    if (port === null && command !== KISS_Command.RETURN) throw new Error('Port cannot be null for non-RETURN commands')

    this.#port = port
    this.#command = command
    this.#payload = payload
  }

  /** KISS port number (0-15), or null for RETURN commands */
  get port(): KISS_Port {
    return this.#command === KISS_Command.RETURN ? null : this.#port
  }

  /** KISS command code */
  get command(): KISS_Command {
    return this.#command
  }

  /** Payload of the KISS frame */
  get payload(): Uint8Array {
    return this.#payload
  }

  /**
   * Encode this KISS frame into bytes ready for transmission
   *
   * Format: [FEND] [CMD] [DATA...] [FEND]
   *
   * @returns Uint8Array ready to send to TNC
   */
  encode(): Uint8Array {
    return encodeKISS_Frame(this.port, this.command, this.payload)
  }

  /**
   * Decode a KISS frame from raw bytes
   *
   * @param bytes Raw bytes containing a KISS frame
   * @returns Tuple of [decoded KISS frame, remaining bytes]
   */
  static decode(bytes: Uint8Array): [KISS_Frame, Uint8Array] {
    const [port, command, payload, remainder] = decodeKISS_Frame(bytes)
    return [new KISS_Frame(port, command, payload), remainder]
  }
}
