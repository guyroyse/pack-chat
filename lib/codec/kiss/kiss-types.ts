/** Frame End - Marks the beginning and end of a KISS frame */
export const FEND = 0xc0

/** Frame Escape - Used to escape special characters in data */
export const FESC = 0xdb

/** Transposed Frame End - FEND when escaped (follows FESC) */
export const TFEND = 0xdc

/** Transposed Frame Escape - FESC when escaped (follows FESC) */
export const TFESC = 0xdd

/** KISS command codes */
export enum KISS_Command {
  /** Send/receive AX.25 packet data */
  DATA_FRAME = 0x00,

  /** Time to wait for transmitter to key up before sending data (in 10ms units) */
  TX_DELAY = 0x01,

  /** P-persistence parameter for CSMA (0-255, where 255 = always transmit) */
  PERSISTENCE = 0x02,

  /** Slot interval for p-persistence algorithm (in 10ms units) */
  SLOT_TIME = 0x03,

  /** Time to keep transmitter on after frame ends (in 10ms units) */
  TX_TAIL = 0x04,

  /** Enable (1) or disable (0) full duplex mode */
  FULL_DUPLEX = 0x05,

  /** TNC-specific hardware configuration */
  SET_HARDWARE = 0x06,

  /** TNC response/diagnostic message (port field is meaningless) */
  RETURN = 0xff
}

/**
 * KISS Payload type
 *
 * The data payload of a KISS frame
 */
export type KISS_Payload = Uint8Array

/**
 * KISS Port type
 *
 * Valid port numbers are 0-15.
 * null indicates no meaningful port (used for RETURN commands)
 */
export type KISS_Port = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | null
