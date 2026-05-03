import { FEND, FESC, TFEND, TFESC } from './kiss-types'

/**
 * Decode a KISS DATA_FRAME from raw bytes (Simplified for PackChat)
 *
 * Only supports DATA_FRAME (0x00) on port 0.
 * Throws an error for any other command or port.
 *
 * @param bytes - Raw bytes containing a KISS frame
 * @returns Tuple of [payload, remainder]
 * @throws Error if not a DATA_FRAME on port 0
 */
export function decodeKISS_Frame(bytes: Uint8Array): [Uint8Array, Uint8Array] {
  /* Enum for the state machine */
  enum State {
    START_OF_FRAME,
    IN_COMMAND_BYTE,
    IN_PAYLOAD,
    ESCAPING_PAYLOAD,
    END_OF_FRAME
  }

  /* The KISS frame cannot be empty */
  if (bytes.length === 0) throw new Error('Empty KISS frame')

  /* State machine variables */
  let state = State.START_OF_FRAME
  let index: number
  let payload: number[] = []

  /* Process each byte according to the current state */
  outer: for (index = 0; index < bytes.length; index++) {
    const byte = bytes[index]

    switch (state) {
      case State.START_OF_FRAME:
        state = processStartOfFrame(byte)
        break
      case State.IN_COMMAND_BYTE:
        state = processCommandByte(byte)
        break
      case State.IN_PAYLOAD:
        state = processPayloadByte(byte)
        break
      case State.END_OF_FRAME:
        break outer
      case State.ESCAPING_PAYLOAD:
        state = processEscapedByte(byte)
        break
      default:
        throw new Error('Invalid state')
    }
  }

  /* After processing, we should be at the end of a frame, if not throw an error */
  if (state !== State.END_OF_FRAME) throw new Error('Incomplete KISS frame')

  /* Return the payload and any remaining bytes after the frame */
  return [new Uint8Array(payload), bytes.subarray(index)]

  /* Processes the start of frame byte, ensuring it is FEND */
  function processStartOfFrame(byte: number): State {
    if (byte === FEND) return State.IN_COMMAND_BYTE
    throw new Error('KISS frame does not start with FEND')
  }

  /* Processes the command byte, validating port and command */
  function processCommandByte(byte: number): State {
    /* Validate port (upper 4 bits must be 0) */
    const port = (byte >> 4) & 0x0f
    if (port !== 0) throw new Error(`Unsupported KISS port. Only port 0 is supported. Got port ${port}`)

    /* Validate command (lower 4 bits must be 0 for DATA_FRAME) */
    const command = byte & 0x0f
    if (command !== 0x00) {
      const commandString = `0x${command.toString(16).padStart(2, '0')}`
      throw new Error(`Unsupported KISS command. Only DATA_FRAME (0x00) is supported. Got command ${commandString}`)
    }

    return State.IN_PAYLOAD
  }

  /* Processes a payload byte, handling escapes and frame termination */
  function processPayloadByte(byte: number): State {
    if (byte === FESC) return State.ESCAPING_PAYLOAD
    if (byte === FEND) return State.END_OF_FRAME
    payload.push(byte)
    return State.IN_PAYLOAD
  }

  /* Processes an escaped byte, ensuring it is a valid escape sequence */
  function processEscapedByte(transposedByte: number): State {
    if (transposedByte !== TFESC && transposedByte !== TFEND) {
      throw new Error('Invalid escape sequence in KISS frame')
    }
    payload.push(transposedByte === TFESC ? FESC : FEND)
    return State.IN_PAYLOAD
  }
}
