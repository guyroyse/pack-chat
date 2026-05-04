/**
 * @packchat/kiss-codec
 *
 * KISS protocol implementation for TNC communication (Simplified for PackChat)
 *
 * Only supports DATA_FRAME (0x00) on port 0.
 */

export { encodeKISS_Frame } from './kiss-encoder'
export { decodeKISS_Frame, IncompleteKISS_FrameError } from './kiss-decoder'
export { KISS_Frame } from './kiss-frame'
export { FEND, FESC, TFEND, TFESC } from './kiss-types'
