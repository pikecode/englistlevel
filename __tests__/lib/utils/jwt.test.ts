import { generateToken, verifyToken, extractTokenFromHeader } from '@/lib/utils/jwt'

describe('JWT Utils', () => {
  it('should generate and verify token', () => {
    const payload = { userId: 'user-123', openid: 'openid-123' }
    const token = generateToken(payload)
    const decoded = verifyToken(token)

    expect(decoded).toEqual(expect.objectContaining(payload))
  })

  it('should return null for invalid token', () => {
    const decoded = verifyToken('invalid-token')
    expect(decoded).toBeNull()
  })

  it('should extract token from header', () => {
    const token = 'test-token-123'
    const header = `Bearer ${token}`
    const extracted = extractTokenFromHeader(header)

    expect(extracted).toBe(token)
  })

  it('should return null for invalid header format', () => {
    const extracted = extractTokenFromHeader('InvalidFormat token')
    expect(extracted).toBeNull()
  })

  it('should return null for missing header', () => {
    const extracted = extractTokenFromHeader(undefined)
    expect(extracted).toBeNull()
  })
})
