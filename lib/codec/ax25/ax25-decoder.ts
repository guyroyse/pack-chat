/**
 * AX.25 Frame Decoder
 *
 * Parses AX.25 frames from byte buffers
 *
 * DROP YOUR EXISTING AX.25 PARSING CODE HERE
 */

import type { AX25_Frame } from './ax25-frame';
import { AX25_Address } from './ax25-address';

/**
 * Parse an AX.25 frame from a buffer
 *
 * @param buffer Raw AX.25 frame bytes (from KISS)
 * @returns Parsed AX.25 frame or null if invalid
 */
export function decodeAX25_Frame(buffer: Buffer): AX25_Frame | null {
  // TODO: Implement or drop in existing parsing code
  // Use AX25_Address.decode() to parse addresses
  throw new Error('Not implemented - add your existing AX.25 parsing code here');
}
