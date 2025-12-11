/**
 * AX.25 Protocol Types
 *
 * Amateur radio packet protocol (AX.25 v2.0)
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

/**
 * Command/Response bit
 * Used in AX.25 address encoding
 */
export enum AX25_CommandResponse {
  COMMAND = 0,
  RESPONSE = 1
}

/**
 * AX.25 Control Field Types
 */
export enum FrameType {
  I_FRAME = 0, // Information frame
  S_FRAME = 1, // Supervisory frame
  U_FRAME = 2 // Unnumbered frame
}

/**
 * Common control field values
 */
export const ControlField = {
  UI: 0x03, // Unnumbered Information (connectionless)
  DM: 0x0f, // Disconnected Mode
  SABM: 0x2f, // Set Async Balanced Mode
  DISC: 0x43, // Disconnect
  UA: 0x63, // Unnumbered Acknowledgment
  FRMR: 0x87 // Frame Reject
}

/**
 * Common PID (Protocol ID) values
 */
export const PID = {
  NO_LAYER_3: 0xf0, // No layer 3 protocol
  AX25_LAYER_3: 0x01, // ISO 8208/CCITT X.25 PLP
  COMPRESSED_TCP_IP: 0x06,
  UNCOMPRESSED_TCP_IP: 0x07,
  SEGMENTATION: 0x08
}
