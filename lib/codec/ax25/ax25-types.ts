/**
 * AX.25 Protocol Types
 *
 * Simplified AX.25 implementation for PackChat
 * - Only supports UI frames (Unnumbered Information, connectionless)
 * - Only supports PID 0xF0 (no layer 3 protocol)
 */

/**
 * Callsign (1-6 uppercase alphanumeric characters)
 */
export type AX25_Callsign = string

/**
 * SSID (Secondary Station Identifier)
 * Valid range: 0-15
 */
export type AX25_SSID = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15
