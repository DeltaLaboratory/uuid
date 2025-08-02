import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UUID } from '.'

// Mock crypto.getRandomValues for consistent testing
const cryptoMock = {
  getRandomValues: vi.fn(),
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('crypto', cryptoMock)
})

describe('UUID Module', () => {
  describe('Constructor and Basic Operations', () => {
    it('should create UUID from valid string', () => {
      const uuid = new UUID('12345678-1234-5678-1234-567812345678')
      expect(uuid.toString()).toBe('12345678-1234-5678-1234-567812345678')
    })

    it('should throw error for invalid UUID string', () => {
      expect(() => new UUID('invalid')).toThrow('Invalid UUID string')
    })

    it('should decode valid encoded string at constructor', () => {
      const uuid = new UUID('aaaaaaaaaaGabaaaaaaaaa')
      expect(uuid.buffer).toEqual(
        Uint8Array.from([0, 0, 0, 0, 0, 0, 64, 0, 128, 0, 0, 0, 0, 0, 0, 0]),
      )
    })
  })

  describe('Parsing and Version Detection', () => {
    it('should properly parse UUIDv1 with specific field values', () => {
      // Test case: C232AB00-9414-11EC-B3C8-9F6BDECED846
      const uuid = UUID.parse('C232AB00-9414-11EC-B3C8-9F6BDECED846')

      // Check version bits (4 bits, value 1)
      expect(uuid.version()).toBe(1)
    })

    it('should properly parse UUIDv3 with specific field values', () => {
      // Test case: 5df41881-3aed-3515-88a7-2f4a814cf09e
      const uuid = UUID.parse('5df41881-3aed-3515-88a7-2f4a814cf09e')

      // Check version bits (4 bits, value 3)
      expect(uuid.version()).toBe(3)
    })

    it('should properly parse UUIDv4 with specific field values', () => {
      // Test case: 919108f7-52d1-4320-9bac-f847db4148a8
      const uuid = UUID.parse('919108f7-52d1-4320-9bac-f847db4148a8')

      // Check version bits (4 bits, value 4)
      expect(uuid.version()).toBe(4)
    })

    it('should properly parse UUIDv5 with specific field values', () => {
      // Test case: 2ed6657d-e927-568b-95e1-2665a8aea6a2
      const uuid = UUID.parse('2ed6657d-e927-568b-95e1-2665a8aea6a2')

      // Check version bits (4 bits, value 5)
      expect(uuid.version()).toBe(5)
    })

    it('should properly parse UUIDv6 with specific field values', () => {
      // Test case: 1EC9414C-232A-6B00-B3C8-9F6BDECED846
      const uuid = UUID.parse('1EC9414C-232A-6B00-B3C8-9F6BDECED846')

      // Check version bits (4 bits, value 6)
      expect(uuid.version()).toBe(6)
    })

    it('should detect correct v4 version', () => {
      expect(UUID.v4().version()).toBe(4)
      expect(UUID.parse('18a094eb-f4b4-4645-973d-65aacc51ffb2').version()).toBe(
        4,
      )
    })

    it('should detect correct v7 version', () => {
      expect(UUID.v7().version()).toBe(7)
      expect(UUID.parse('019597bd-76bb-7d96-b39f-a0d1df976dc3').version()).toBe(
        7,
      )
    })
  })

  describe('UUID Generation', () => {
    describe('v4 Generation', () => {
      it('should generate valid v4 UUID structure', () => {
        // Mock random values
        const mockBytes = new Uint8Array(16).fill(0)
        cryptoMock.getRandomValues.mockReturnValue(mockBytes)

        const uuid = UUID.v4()
        expect(uuid.buffer[6] & 0xf0).toBe(0x40) // Version 4
        expect(uuid.buffer[8] & 0xc0).toBe(0x80) // Variant bits
      })
    })

    describe('v7 Generation', () => {
      it('should generate valid v7 structure', () => {
        const mockBytes = new Uint8Array(16).fill(0)
        cryptoMock.getRandomValues.mockReturnValue(mockBytes)

        const uuid = UUID.v7()
        expect(uuid.buffer[6] & 0xf0).toBe(0x70) // Version 7
      })

      it('should contain correct timestamp', () => {
        const mockBytes = new Uint8Array(16).fill(0)
        cryptoMock.getRandomValues.mockReturnValue(mockBytes)

        const fixedTime = 1710000000000
        const uuid = UUID.v7(fixedTime)
        expect(uuid.time()).toBe(fixedTime)
      })

      it('should properly parse UUIDv7 with specific field values', () => {
        // Test case: 017F22E2-79B0-7CC3-98C4-DC0C0C07398F
        // The timestamp is Tuesday, February 22, 2022 2:22:22.00 PM GMT-05:00, represented as 0x017F22E279B0
        const uuid = UUID.parse('017F22E2-79B0-7CC3-98C4-DC0C0C07398F')

        // Check version bits (4 bits, value 7)
        expect(uuid.version()).toBe(7)
        // Verify timestamp extraction is correct (1645557742000)
        expect(uuid.time()).toBe(1645557742000)
      })

      it('should travel valid time', () => {
        const now = Date.now()

        const uuid = UUID.v7()
        const encoded = uuid.encode()
        const decoded = UUID.decode(encoded)

        expect(decoded.time()).toBe(now)
      })
    })
  })

  describe('Encoding and Decoding', () => {
    it('should encode UUID to 22-character string', () => {
      const uuid = new UUID('12345678-1234-5678-1234-567812345678')
      expect(uuid.encode()).toHaveLength(22)
    })

    it('should round-trip encode/decode correctly', () => {
      const original = UUID.v4()
      const encoded = original.encode()
      const decoded = UUID.decode(encoded)
      expect(decoded.buffer).toEqual(original.buffer)
    })

    it('should reject invalid encoded characters', () => {
      expect(() => UUID.decode('invalid!characters!!!!')).toThrow(
        'Invalid character',
      )
    })
  })

  describe('String Parsing and Formatting', () => {
    it('should format as standard UUID string', () => {
      const uuid = new UUID('12345678-1234-5678-1234-567812345678')
      expect(uuid.toString()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      )
    })

    it('parses 36-character UUID string', () => {
      const uuid = UUID.parse('12345678-1234-5678-1234-567812345678')
      expect(uuid.buffer).toEqual(
        Uint8Array.from([
          18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120,
        ]),
      )
    })

    it('parses 32-character UUID string', () => {
      const uuid = UUID.parse('12345678123456781234567812345678')
      expect(uuid.buffer).toEqual(
        Uint8Array.from([
          18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120,
        ]),
      )
    })

    it('parses UUID string with urn prefix', () => {
      const uuid = UUID.parse('urn:uuid:12345678-1234-5678-1234-567812345678')
      expect(uuid.buffer).toEqual(
        Uint8Array.from([
          18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120,
        ]),
      )
    })

    it('parses UUID string with curly braces', () => {
      const uuid = UUID.parse('{12345678-1234-5678-1234-567812345678}')
      expect(uuid.buffer).toEqual(
        Uint8Array.from([
          18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120, 18, 52, 86, 120,
        ]),
      )
    })

    it('throws error for invalid UUID string length', () => {
      expect(() => UUID.parse('123')).toThrow('Invalid UUID string')
    })

    it('throws error for invalid UUID string format', () => {
      expect(() => UUID.parse('12345678-1234-5678-1234-56781234567')).toThrow(
        'Invalid UUID string',
      )
    })

    it('throws error for invalid URN prefix', () => {
      expect(() =>
        UUID.parse('urn:pitu:12345678-1234-5678-1234-567812345678'),
      ).toThrow('Invalid URN prefix')
    })

    it('throws error for invalid characters in 32-character UUID string', () => {
      expect(() => UUID.parse('1234567812345678123Z56781234567G')).toThrow(
        'Invalid UUID string',
      )
    })
  })

  describe('Utility Methods', () => {
    it('should check equality', () => {
      const a = UUID.parse('019597bd-76bb-7d96-b39f-a0d1df976dc3')
      const b = UUID.parse('019597bd-76bb-7d96-b39f-a0d1df976dc3')
      const c = UUID.parse('59c9c143-e191-4760-88e9-2890b8bf817a')

      expect(a.equal(a)).toBe(true)
      expect(a.equal(b)).toBe(true)
      expect(b.equal(c)).toBe(false)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty buffer construction', () => {
      expect(() => new UUID(new Uint8Array(10))).toThrow('Invalid UUID length')
    })
  })
})
