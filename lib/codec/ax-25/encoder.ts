/**
 * AX.25 Frame Encoder
 *
 * Builds AX.25 frames for transmission
 */

import { AX25Frame, AX25Address } from './types';

/**
 * Encode an AX.25 frame into bytes
 *
 * @param frame AX.25 frame to encode
 * @returns Buffer ready to wrap in KISS frame
 */
export function encodeAX25Frame(frame: AX25Frame): Buffer {
  const addresses: Buffer[] = [];

  // Destination address
  addresses.push(encodeAddress(frame.destination, false));

  // Source address (set extension bit if no repeaters)
  const isLastAddress = frame.repeaters.length === 0;
  addresses.push(encodeAddress(frame.source, isLastAddress));

  // Repeater addresses
  frame.repeaters.forEach((repeater, index) => {
    const isLast = index === frame.repeaters.length - 1;
    addresses.push(encodeAddress(repeater, isLast));
  });

  // Calculate total frame size
  const addressLength = addresses.reduce((sum, buf) => sum + buf.length, 0);
  const pidLength = frame.pid !== undefined ? 1 : 0;
  const totalLength = addressLength + 1 + pidLength + frame.info.length;

  // Build frame
  const buffer = Buffer.allocUnsafe(totalLength);
  let offset = 0;

  // Copy addresses
  for (const addr of addresses) {
    addr.copy(buffer, offset);
    offset += addr.length;
  }

  // Control field
  buffer[offset++] = frame.control;

  // PID (if present)
  if (frame.pid !== undefined) {
    buffer[offset++] = frame.pid;
  }

  // Info field
  frame.info.copy(buffer, offset);

  return buffer;
}

/**
 * Encode an AX.25 address into 7 bytes
 *
 * Address format:
 * - Bytes 0-5: Callsign (ASCII shifted left 1 bit, space-padded)
 * - Byte 6: SSID (bits 1-4) and flags
 *
 * @param address AX.25 address to encode
 * @param isLast Set extension bit (true = last address in frame)
 * @returns 7-byte buffer
 */
export function encodeAddress(address: AX25Address, isLast: boolean): Buffer {
  const buffer = Buffer.alloc(7, 0x40); // Fill with space (0x20 << 1 = 0x40)

  // Encode callsign (left-justified, space-padded, shifted left 1 bit)
  const callsign = address.callsign.toUpperCase().substring(0, 6);
  for (let i = 0; i < callsign.length; i++) {
    buffer[i] = callsign.charCodeAt(i) << 1;
  }

  // Encode SSID byte
  let ssidByte = 0;

  // Bits 1-4: SSID
  ssidByte |= (address.ssid & 0x0F) << 1;

  // Bit 5: Reserved (typically 1)
  ssidByte |= 0b01100000;

  // Bit 6: Command/Response (C bit)
  if (address.chBit) {
    ssidByte |= 0b10000000;
  }

  // Bit 7: Extension bit (0 = more addresses, 1 = last)
  if (isLast) {
    ssidByte |= 0x01;
  }

  buffer[6] = ssidByte;

  return buffer;
}

/**
 * Create a simple AX.25 UI frame for PackChat
 */
export function createUIFrame(
  source: string,
  sourceSSID: number,
  info: Buffer
): AX25Frame {
  return {
    destination: {
      callsign: 'APCHAT',
      ssid: 0
    },
    source: {
      callsign: source,
      ssid: sourceSSID
    },
    repeaters: [],
    control: 0x03,  // UI frame
    pid: 0xF0,      // No layer 3
    info
  };
}
