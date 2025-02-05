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
    describe('Core Functionality', () => {
        it('should encode UUID to 22-character string', () => {
            const uuid = new UUID('12345678-1234-5678-1234-567812345678')
            expect(uuid.encode()).toHaveLength(22)
        })

        it('should round-trip encode/decode correctly', () => {
            const original = UUID.v4()
            const encoded = original.encode()
            const decoded = UUID.decode(encoded)
            console.log(original.buffer)
            expect(decoded.buffer).toEqual(original.buffer)
        })

        it('should throw error for invalid UUID string', () => {
            expect(() => new UUID('invalid')).toThrow('Invalid UUID string')
        })

        it('should decode valid encoded string at constructor', () => {
            const uuid = new UUID('aaaaaaaaaaGabaaaaaaaaa')
            expect(uuid.buffer).toEqual(Uint8Array.from([0,0,0,0,0,0,64,0,128,0,0,0,0,0,0,0]))
        })
    })

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
        it('should contain correct timestamp', () => {
            const mockBytes = new Uint8Array(16).fill(0)
            cryptoMock.getRandomValues.mockReturnValue(mockBytes)

            const fixedTime = 1710000000000
            const uuid = UUID.v7(fixedTime)
            expect(uuid.time()).toBe(fixedTime)
        })

        it('should generate valid v7 structure', () => {
            const mockBytes = new Uint8Array(16).fill(0)
            cryptoMock.getRandomValues.mockReturnValue(mockBytes)

            const uuid = UUID.v7()
            expect(uuid.buffer[6] & 0xf0).toBe(0x70) // Version 7
        })
    })

    describe('String Conversion', () => {
        it('should format as standard UUID string', () => {
            const uuid = new UUID('12345678-1234-5678-1234-567812345678')
            expect(uuid.toString()).toMatch(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
            )
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty buffer construction', () => {
            expect(() => new UUID(new Uint8Array(10))).toThrow('Invalid UUID length')
        })

        it('should reject invalid encoded characters', () => {
            expect(() => UUID.decode('invalid!characters!!!!')).toThrow('Invalid character')
        })
    })
})
