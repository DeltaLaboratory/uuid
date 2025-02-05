const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
const charsetMap: Record<string, number> = {
    'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7,
    'i': 8, 'j': 9, 'k': 10, 'l': 11, 'm': 12, 'n': 13, 'o': 14, 'p': 15,
    'q': 16, 'r': 17, 's': 18, 't': 19, 'u': 20, 'v': 21, 'w': 22, 'x': 23,
    'y': 24, 'z': 25, 'A': 26, 'B': 27, 'C': 28, 'D': 29, 'E': 30, 'F': 31,
    'G': 32, 'H': 33, 'I': 34, 'J': 35, 'K': 36, 'L': 37, 'M': 38, 'N': 39,
    'O': 40, 'P': 41, 'Q': 42, 'R': 43, 'S': 44, 'T': 45, 'U': 46, 'V': 47,
    'W': 48, 'X': 49, 'Y': 50, 'Z': 51, '0': 52, '1': 53, '2': 54, '3': 55,
    '4': 56, '5': 57, '6': 58, '7': 59, '8': 60, '9': 61, '_': 62, '-': 63
}

// UUID represents a universally unique identifier
class UUID {
    readonly _buffer: Uint8Array;

    constructor(source: string | Uint8Array) {
        if (typeof source === 'string') {
            if (source.length === 22) {
                this._buffer = UUID.decode(source).buffer;
                return;
            } else if (source.length === 36) {
                const hex = source.replace(/-/g, '');
                this._buffer = new Uint8Array(16);
                for (let i = 0; i < 32; i += 2) {
                    this._buffer[i/2] = parseInt(hex.substring(i, i+2), 16);
                }
                return;
            } else {
                throw Error('Invalid UUID string');
            }
        } else {
            this._buffer = new Uint8Array(source);
            if (this._buffer.length !== 16) throw Error('Invalid UUID length');
        }
    }

    // encode encodes the UUID into a 22-character string
    encode() {
        const result = new Array(22);
        let bitPos = 0;
        let bytePos = 0;

        for (let i = 21; i >= 0; i--) {
            let chunk = 0;
            for (let j = 0; j < 6; j++) {
                if (bytePos < 16) {
                    const bit = (this._buffer[bytePos] >> bitPos) & 1;
                    chunk |= bit << j;
                    bitPos++;
                    if (bitPos === 8) {
                        bitPos = 0;
                        bytePos++;
                    }
                }
            }
            result[i] = charset[chunk];
        }
        return result.join('');
    }

    // time returns the timestamp encoded in the UUID
    // note: this is only available for UUIDs generated with v7
    time() {
        const view = new DataView(this._buffer.buffer);
        return view.getUint32(0, false) * 1000 + view.getUint16(4, false);
    }

    // toString returns the UUID as a 36-character string
    toString() {
        const hex = [];
        for (let i = 0; i < this._buffer.length; i++) {
            hex.push((this._buffer[i] >>> 4).toString(16));
            hex.push((this._buffer[i] & 0xf).toString(16));
        }
        return [
            hex.slice(0, 8).join(''),
            hex.slice(8, 12).join(''),
            hex.slice(12, 16).join(''),
            hex.slice(16, 20).join(''),
            hex.slice(20, 32).join('')
        ].join('-');
    }

    // decode decodes a 22-character string into a UUID
    static decode(encoded: string) {
        if (encoded.length !== 22) throw Error('Invalid encoded length');

        const bytes = new Uint8Array(16);
        let bitPos = 0;
        let bytePos = 0;

        for (let i = 21; i >= 0; i--) {
            const val = charsetMap[encoded[i]];
            if (val === undefined) throw Error(`Invalid character: ${encoded[i]}`);

            for (let j = 0; j < 6; j++) {
                if (bytePos >= 16) break;

                const bit = (val >> j) & 1;
                bytes[bytePos] |= bit << bitPos;

                bitPos++;
                if (bitPos === 8) {
                    bitPos = 0;
                    bytePos++;
                }
            }
        }

        return new UUID(bytes);
    }

    static v4() {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return new UUID(bytes);
    }

    static v7(time: number = Date.now()) {
        const bytes = new Uint8Array(16);
        const view = new DataView(bytes.buffer);
        view.setUint32(0, time / 1000 | 0, false);
        view.setUint16(4, time % 1000, false);
        view.setUint16(6, 0x7000 | (crypto.getRandomValues(new Uint16Array(1))[0] & 0x0fff), false);
        crypto.getRandomValues(new Uint8Array(bytes.buffer, 8));
        return new UUID(bytes);
    }

    get buffer() {
        return this._buffer;
    }
}

export { UUID };