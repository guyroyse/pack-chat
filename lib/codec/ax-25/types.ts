/**
 * AX.25 Protocol Types
 *
 * Amateur radio packet protocol (AX.25 v2.0)
 */

/**
 * AX.25 address (callsign with SSID)
 */
export interface AX25Address {
  callsign: string;  // Up to 6 characters (e.g., "K6ABC")
  ssid: number;      // 0-15

  // Extension bits
  chBit?: boolean;   // Command/Response bit
  reserved?: boolean;
  extensionBit?: boolean;  // 0 = more addresses follow, 1 = last address
}

/**
 * AX.25 frame structure
 */
export interface AX25Frame {
  destination: AX25Address;
  source: AX25Address;
  repeaters: AX25Address[];  // Digipeater path (empty for direct)

  control: number;   // Control field (1 or 2 bytes)
  pid?: number;      // Protocol ID (present if I-frame or UI-frame)

  info: Buffer;      // Information field (payload)
}

/**
 * AX.25 Control Field Types
 */
export enum FrameType {
  I_FRAME = 0,    // Information frame
  S_FRAME = 1,    // Supervisory frame
  U_FRAME = 2     // Unnumbered frame
}

/**
 * Common control field values
 */
export const ControlField = {
  UI: 0x03,       // Unnumbered Information (connectionless)
  DM: 0x0F,       // Disconnected Mode
  SABM: 0x2F,     // Set Async Balanced Mode
  DISC: 0x43,     // Disconnect
  UA: 0x63,       // Unnumbered Acknowledgment
  FRMR: 0x87      // Frame Reject
};

/**
 * Common PID (Protocol ID) values
 */
export const PID = {
  NO_LAYER_3: 0xF0,     // No layer 3 protocol
  AX25_LAYER_3: 0x01,   // ISO 8208/CCITT X.25 PLP
  COMPRESSED_TCP_IP: 0x06,
  UNCOMPRESSED_TCP_IP: 0x07,
  SEGMENTATION: 0x08
};
