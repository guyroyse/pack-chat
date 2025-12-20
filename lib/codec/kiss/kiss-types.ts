/**
 * KISS Protocol Constants (Simplified for PackChat)
 *
 * PackChat only uses:
 * - DATA_FRAME command (0x00)
 * - Port 0 (single TNC)
 * - Frame escaping for 0xC0 and 0xDB
 */

/** Frame End - Marks the beginning and end of a KISS frame */
export const FEND = 0xc0

/** Frame Escape - Used to escape special characters in data */
export const FESC = 0xdb

/** Transposed Frame End - FEND when escaped (follows FESC) */
export const TFEND = 0xdc

/** Transposed Frame Escape - FESC when escaped (follows FESC) */
export const TFESC = 0xdd
