/**
 * AX.25 Frame Decoder
 *
 * Parses AX.25 frames from byte buffers
 *
 * DROP YOUR EXISTING AX.25 PARSING CODE HERE
 */

import { AX25Frame, AX25Address } from './types';

/**
 * Parse an AX.25 frame from a buffer
 *
 * @param buffer Raw AX.25 frame bytes (from KISS)
 * @returns Parsed AX.25 frame or null if invalid
 */
export function decodeAX25Frame(buffer: Buffer): AX25Frame | null {
  // TODO: Implement or drop in existing parsing code
  throw new Error('Not implemented - add your existing AX.25 parsing code here');
}

/**
 * Parse an AX.25 address from 7 bytes
 *
 * Address format:
 * - Bytes 0-5: Callsign (ASCII shifted left 1 bit, space-padded)
 * - Byte 6: SSID (bits 1-4) and flags
 */
export function decodeAddress(buffer: Buffer, offset: number): AX25Address {
  // TODO: Implement or drop in existing parsing code
  throw new Error('Not implemented');
}
