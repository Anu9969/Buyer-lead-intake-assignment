import { BuyerSchema, validateCSVRow } from '@/lib/validation'

describe('Buyer Validation', () => {
  describe('BuyerSchema', () => {
    const validBuyer = {
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '9876543210',
      city: 'CHANDIGARH',
      propertyType: 'APARTMENT',
      bhk: 'TWO',
      purpose: 'BUY',
      budgetMin: 5000000,
      budgetMax: 8000000,
      timeline: 'ZERO_TO_THREE_MONTHS',
      source: 'WEBSITE',
      notes: 'Looking for a good apartment',
      tags: ['urgent', 'family']
    }

    it('should validate a complete buyer object', () => {
      const result = BuyerSchema.safeParse(validBuyer)
      expect(result.success).toBe(true)
    })

    it('should require BHK for apartment properties', () => {
      const buyerWithoutBhk = { ...validBuyer, bhk: undefined }
      const result = BuyerSchema.safeParse(buyerWithoutBhk)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('BHK is required for Apartment and Villa properties')
      }
    })

    it('should require BHK for villa properties', () => {
      const villaBuyer = { ...validBuyer, propertyType: 'VILLA', bhk: undefined }
      const result = BuyerSchema.safeParse(villaBuyer)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('BHK is required for Apartment and Villa properties')
      }
    })

    it('should not require BHK for plot properties', () => {
      const plotBuyer = { ...validBuyer, propertyType: 'PLOT', bhk: undefined }
      const result = BuyerSchema.safeParse(plotBuyer)
      expect(result.success).toBe(true)
    })

    it('should validate budget constraints', () => {
      const buyerWithInvalidBudget = { 
        ...validBuyer, 
        budgetMin: 8000000, 
        budgetMax: 5000000 
      }
      const result = BuyerSchema.safeParse(buyerWithInvalidBudget)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum budget must be greater than or equal to minimum budget')
      }
    })

    it('should accept valid budget ranges', () => {
      const buyerWithValidBudget = { 
        ...validBuyer, 
        budgetMin: 5000000, 
        budgetMax: 8000000 
      }
      const result = BuyerSchema.safeParse(buyerWithValidBudget)
      expect(result.success).toBe(true)
    })

    it('should validate full name length', () => {
      const buyerWithShortName = { ...validBuyer, fullName: 'A' }
      const result = BuyerSchema.safeParse(buyerWithShortName)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name must be at least 2 characters')
      }
    })

    it('should validate phone number length', () => {
      const buyerWithShortPhone = { ...validBuyer, phone: '123' }
      const result = BuyerSchema.safeParse(buyerWithShortPhone)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Phone must be at least 10 digits')
      }
    })

    it('should validate email format', () => {
      const buyerWithInvalidEmail = { ...validBuyer, email: 'invalid-email' }
      const result = BuyerSchema.safeParse(buyerWithInvalidEmail)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format')
      }
    })

    it('should allow empty email', () => {
      const buyerWithoutEmail = { ...validBuyer, email: '' }
      const result = BuyerSchema.safeParse(buyerWithoutEmail)
      expect(result.success).toBe(true)
    })

    it('should validate notes length', () => {
      const longNotes = 'a'.repeat(1001)
      const buyerWithLongNotes = { ...validBuyer, notes: longNotes }
      const result = BuyerSchema.safeParse(buyerWithLongNotes)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Notes must be at most 1000 characters')
      }
    })
  })

  describe('CSV Validation', () => {
    const validCSVRow = {
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543210',
      city: 'MOHALI',
      propertyType: 'VILLA',
      bhk: 'THREE',
      purpose: 'RENT',
      budgetMin: '50000',
      budgetMax: '80000',
      timeline: 'THREE_TO_SIX_MONTHS',
      source: 'REFERRAL',
      notes: 'Looking for a villa',
      tags: 'family,urgent'
    }

    it('should validate a valid CSV row', () => {
      const result = validateCSVRow(validCSVRow, 0)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.fullName).toBe('Jane Smith')
        expect(result.data.budgetMin).toBe(50000)
        expect(result.data.budgetMax).toBe(80000)
        expect(result.data.tags).toEqual(['family', 'urgent'])
      }
    })

    it('should handle empty email in CSV', () => {
      const rowWithEmptyEmail = { ...validCSVRow, email: '' }
      const result = validateCSVRow(rowWithEmptyEmail, 0)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBeUndefined()
      }
    })

    it('should handle empty budget values in CSV', () => {
      const rowWithEmptyBudget = { ...validCSVRow, budgetMin: '', budgetMax: '' }
      const result = validateCSVRow(rowWithEmptyBudget, 0)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.budgetMin).toBeUndefined()
        expect(result.data.budgetMax).toBeUndefined()
      }
    })

    it('should handle empty tags in CSV', () => {
      const rowWithEmptyTags = { ...validCSVRow, tags: '' }
      const result = validateCSVRow(rowWithEmptyTags, 0)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tags).toEqual([])
      }
    })

    it('should return error for invalid CSV row', () => {
      const invalidRow = { ...validCSVRow, fullName: '', phone: '123' }
      const result = validateCSVRow(invalidRow, 5)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Row 6')
        expect(result.error).toContain('Name must be at least 2 characters')
        expect(result.error).toContain('Phone must be at least 10 digits')
      }
    })

    it('should handle invalid budget values in CSV', () => {
      const rowWithInvalidBudget = { ...validCSVRow, budgetMin: 'invalid', budgetMax: '-100' }
      const result = validateCSVRow(rowWithInvalidBudget, 3)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('Row 4')
      }
    })
  })
})
