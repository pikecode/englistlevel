import { validate, validateField, ValidationError, CommonRules } from '@/lib/utils/validators'

describe('Validators', () => {
  describe('validateField', () => {
    it('should validate required field', () => {
      expect(() => {
        validateField(undefined, { required: true }, 'email')
      }).toThrow(ValidationError)
    })

    it('should validate string type', () => {
      expect(() => {
        validateField(123, { type: 'string' }, 'name')
      }).toThrow(ValidationError)
    })

    it('should validate string length', () => {
      expect(() => {
        validateField('ab', { min: 3 }, 'password')
      }).toThrow(ValidationError)
    })

    it('should validate number range', () => {
      expect(() => {
        validateField(150, { max: 100 }, 'score')
      }).toThrow(ValidationError)
    })

    it('should validate pattern', () => {
      expect(() => {
        validateField('invalid-email', { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, 'email')
      }).toThrow(ValidationError)
    })

    it('should pass valid field', () => {
      expect(() => {
        validateField('valid@email.com', { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }, 'email')
      }).not.toThrow()
    })
  })

  describe('validate', () => {
    it('should validate object against schema', () => {
      const schema = {
        email: { required: true, type: 'string' as const },
        age: { type: 'number' as const, min: 0, max: 150 },
      }

      expect(() => {
        validate({ email: 'test@example.com', age: 25 }, schema)
      }).not.toThrow()
    })

    it('should throw on invalid object', () => {
      const schema = {
        email: { required: true, type: 'string' as const },
      }

      expect(() => {
        validate({ email: undefined }, schema)
      }).toThrow(ValidationError)
    })
  })

  describe('CommonRules', () => {
    it('should validate email', () => {
      expect(() => {
        validateField('test@example.com', CommonRules.email, 'email')
      }).not.toThrow()

      expect(() => {
        validateField('invalid-email', CommonRules.email, 'email')
      }).toThrow()
    })

    it('should validate mastery score', () => {
      expect(() => {
        validateField(85, CommonRules.masteryScore, 'score')
      }).not.toThrow()

      expect(() => {
        validateField(150, CommonRules.masteryScore, 'score')
      }).toThrow()
    })
  })
})
