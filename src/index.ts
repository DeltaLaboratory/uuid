const charset =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'
const charsetMap: Record<string, number> = {
  'a': 0,
  'b': 1,
  'c': 2,
  'd': 3,
  'e': 4,
  'f': 5,
  'g': 6,
  'h': 7,
  'i': 8,
  'j': 9,
  'k': 10,
  'l': 11,
  'm': 12,
  'n': 13,
  'o': 14,
  'p': 15,
  'q': 16,
  'r': 17,
  's': 18,
  't': 19,
  'u': 20,
  'v': 21,
  'w': 22,
  'x': 23,
  'y': 24,
  'z': 25,
  'A': 26,
  'B': 27,
  'C': 28,
  'D': 29,
  'E': 30,
  'F': 31,
  'G': 32,
  'H': 33,
  'I': 34,
  'J': 35,
  'K': 36,
  'L': 37,
  'M': 38,
  'N': 39,
  'O': 40,
  'P': 41,
  'Q': 42,
  'R': 43,
  'S': 44,
  'T': 45,
  'U': 46,
  'V': 47,
  'W': 48,
  'X': 49,
  'Y': 50,
  'Z': 51,
  '0': 52,
  '1': 53,
  '2': 54,
  '3': 55,
  '4': 56,
  '5': 57,
  '6': 58,
  '7': 59,
  '8': 60,
  '9': 61,
  '_': 62,
  '-': 63,
}

// UUID represents a universally unique identifier
class UUID {
  readonly _buffer: Uint8Array

  // Nil represents the nil UUID (all zeros)
  // https://www.rfc-editor.org/rfc/rfc9562#section-5.9
  static readonly Nil = new UUID(new Uint8Array(16).fill(0))

  // Max represents the max UUID (all ones)
  // https://www.rfc-editor.org/rfc/rfc9562#section-5.10
  static readonly Max = new UUID(new Uint8Array(16).fill(0xff))

  constructor(source: string | Uint8Array) {
    switch (typeof source) {
      case 'string':
        switch (source.length) {
          case 22:
            this._buffer = UUID.decode(source).buffer
            return
          case 36: // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx/
          case 36 + 9: // urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
          case 36 + 2: // {xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}
          case 32: // xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            this._buffer = UUID.parse(source).buffer
            return
          default:
            throw Error('Invalid UUID string')
        }
      default:
        this._buffer = new Uint8Array(source)
        if (this._buffer.length !== 16) throw Error('Invalid UUID length')
    }
  }

  // encode encodes the UUID into a 22-character string
  encode() {
    const result = new Array(22)
    let bitPos = 0
    let bytePos = 0

    for (let i = 21; i >= 0; i--) {
      let chunk = 0
      for (let j = 0; j < 6; j++) {
        if (bytePos < 16) {
          const bit = (this._buffer[bytePos] >> bitPos) & 1
          chunk |= bit << j
          bitPos++
          if (bitPos === 8) {
            bitPos = 0
            bytePos++
          }
        }
      }
      result[i] = charset[chunk]
    }
    return result.join('')
  }

  // time returns the timestamp encoded in the UUID
  // note: this is only available for UUIDs generated with v7
  time() {
    if (this.version() !== 7) throw Error('Not a v7 UUID')

    const view = new DataView(this._buffer.buffer)

    // Read the first 6 bytes as a 48-bit timestamp in milliseconds
    const msb = view.getUint32(0, false) // Most significant 32 bits
    const lsb = view.getUint16(4, false) // Least significant 16 bits

    // Combine them: left shift msb by 16 bits and add lsb
    return msb * 0x10000 + lsb
  }

  // version returns the version number of the UUID
  version() {
    return (this._buffer[6] & 0xf0) >> 4
  }

  // toString returns UUID as a 36-character string in form of
  // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  // https://www.rfc-editor.org/rfc/rfc9562#section-4
  toString() {
    const hex = []
    for (let i = 0; i < this._buffer.length; i++) {
      hex.push((this._buffer[i] >>> 4).toString(16))
      hex.push((this._buffer[i] & 0xf).toString(16))
    }
    return [
      hex.slice(0, 8).join(''),
      hex.slice(8, 12).join(''),
      hex.slice(12, 16).join(''),
      hex.slice(16, 20).join(''),
      hex.slice(20, 32).join(''),
    ].join('-')
  }

  // toJSON returns JSON representation of UUID
  toJSON() {
    return this.toString()
  }

  equal(other: UUID) {
    return bufferEqual(this._buffer, other._buffer)
  }

  // decode decodes a 22-character string into a UUID
  static decode(encoded: string) {
    if (encoded.length !== 22) throw Error('Invalid encoded length')

    const bytes = new Uint8Array(16)
    let bitPos = 0
    let bytePos = 0

    for (let i = 21; i >= 0; i--) {
      const val = charsetMap[encoded[i]]
      if (val === undefined) throw Error(`Invalid character: ${encoded[i]}`)

      for (let j = 0; j < 6; j++) {
        if (bytePos >= 16) break

        const bit = (val >> j) & 1
        bytes[bytePos] |= bit << bitPos

        bitPos++
        if (bitPos === 8) {
          bitPos = 0
          bytePos++
        }
      }
    }

    return new UUID(bytes)
  }

  static parse(s: string) {
    switch (s.length) {
      // xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
      case 36:
        break
      case 36 + 9:
        if (s.startsWith('urn:uuid:')) {
          s = s.slice(9)
          break
        }
        throw Error('Invalid URN prefix')
      case 36 + 2:
        if (s.startsWith('{') && s.endsWith('}')) {
          s = s.slice(1, -1)
          break
        }
        throw Error('Invalid UUID string')
      case 32:
        for (let i = 0; i < 32; i++) {
          // check s is hex
          if (s[i] < '0' || (s[i] > '9' && s[i] < 'A') || s[i] > 'F') {
            throw Error('Invalid UUID string')
          }
        }

        const bytes = new Uint8Array(16)
        for (let i = 0; i < 32; i += 2) {
          bytes[i / 2] = parseInt(s.substring(i, i + 2), 16)
        }

        return new UUID(bytes)
      default:
        throw Error('Invalid UUID string')
    }

    if (s[8] !== '-' || s[13] !== '-' || s[18] !== '-' || s[23] !== '-') {
      throw Error('Invalid UUID string')
    }

    const bytes = new Uint8Array(16)
    const hex = s.replace(/-/g, '')
    for (let i = 0; i < 32; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
    }
    return new UUID(bytes)
  }

  // UUIDv4 (https://www.rfc-editor.org/rfc/rfc9562#section-5.4)
  static v4() {
    //  0                   1                   2                   3
    //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                           random_a                            |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |          random_a             |  ver  |       random_b        |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |var|                       random_c                            |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                           random_c                            |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    return new UUID(bytes)
  }

  // UUIDv7 (https://www.rfc-editor.org/rfc/rfc9562#section-5.7)
  static v7(time: number = Date.now()) {
    //  0                   1                   2                   3
    //  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                           unix_ts_ms                          |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |          unix_ts_ms           |  ver  |       rand_a          |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |var|                        rand_b                             |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    // |                            rand_b                             |
    // +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

    const bytes = new Uint8Array(16)
    const view = new DataView(bytes.buffer)

    // Set the 48-bit timestamp in the first 6 bytes
    view.setUint32(0, Math.floor(time / 0x10000), false) // Upper 32 bits
    view.setUint16(4, time & 0xffff, false) // Lower 16 bits

    // Fill remaining 10 bytes with random data
    crypto.getRandomValues(new Uint8Array(bytes.buffer, 6, 10))

    // Set version (4 bits) to 7 in byte 6
    bytes[6] = (bytes[6] & 0x0f) | 0x70

    // Set variant (2 bits) to 0b10 in byte 8
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    return new UUID(bytes)
  }

  get buffer() {
    return this._buffer
  }
}

function bufferEqual(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength != b.byteLength) return false
  for (let i = 0; i != a.byteLength; i++) {
    if (a[i] != b[i]) return false
  }
  return true
}

export { UUID }
