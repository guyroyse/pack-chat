/**
 * AX.25 Frame Encoder
 *
 * Builds AX.25 frames for transmission
 */

import { AX25_Address } from './ax25-address';

/**
 * Encode an AX.25 frame into bytes
 *
 * @param destination Destination address
 * @param source Source address
 * @param repeaters Digipeater path (empty array for direct)
 * @param control Control field value
 * @param pid Protocol ID (undefined if not present)
 * @param info Information field payload
 * @returns Buffer ready to wrap in KISS frame
 */
export function encodeAX25_Frame(
  destination: AX25_Address,
  source: AX25_Address,
  repeaters: AX25_Address[],
  control: number,
  pid: number | undefined,
  info: Buffer
): Buffer {
  const addresses: Buffer[] = [];

  // Destination address (never last)
  destination.extensionBit = false;
  addresses.push(destination.encode());

  // Source address (last if no repeaters)
  source.extensionBit = repeaters.length === 0;
  addresses.push(source.encode());

  // Repeater addresses (last one has extension bit set)
  repeaters.forEach((repeater, index) => {
    repeater.extensionBit = index === repeaters.length - 1;
    addresses.push(repeater.encode());
  });

  // Calculate total frame size
  const addressLength = addresses.reduce((sum, buf) => sum + buf.length, 0);
  const pidLength = pid !== undefined ? 1 : 0;
  const totalLength = addressLength + 1 + pidLength + info.length;

  // Build frame
  const buffer = Buffer.allocUnsafe(totalLength);
  let offset = 0;

  // Copy addresses
  for (const addr of addresses) {
    addr.copy(buffer, offset);
    offset += addr.length;
  }

  // Control field
  buffer[offset++] = control;

  // PID (if present)
  if (pid !== undefined) {
    buffer[offset++] = pid;
  }

  // Info field
  info.copy(buffer, offset);

  return buffer;
}

