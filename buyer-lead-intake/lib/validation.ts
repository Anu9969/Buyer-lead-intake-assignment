import { z } from 'zod';

// Enum schemas matching Prisma schema
export const CitySchema = z.enum(['CHANDIGARH', 'MOHALI', 'ZIRAKPUR', 'PANCHKULA', 'OTHER']);
export const PropertyTypeSchema = z.enum(['APARTMENT', 'VILLA', 'PLOT', 'OFFICE', 'RETAIL']);
export const BhkSchema = z.enum(['STUDIO', 'ONE', 'TWO', 'THREE', 'FOUR']);
export const PurposeSchema = z.enum(['BUY', 'RENT']);
export const TimelineSchema = z.enum(['ZERO_TO_THREE_MONTHS', 'THREE_TO_SIX_MONTHS', 'MORE_THAN_SIX_MONTHS', 'EXPLORING']);
export const SourceSchema = z.enum(['WEBSITE', 'REFERRAL', 'WALK_IN', 'CALL', 'OTHER']);
export const StatusSchema = z.enum(['NEW', 'QUALIFIED', 'CONTACTED', 'VISITED', 'NEGOTIATION', 'CONVERTED', 'DROPPED']);

// Main buyer validation schema
export const BuyerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone must be at most 15 digits'),
  city: CitySchema,
  propertyType: PropertyTypeSchema,
  bhk: BhkSchema.optional(),
  purpose: PurposeSchema,
  budgetMin: z.number().int().min(0, 'Budget must be positive').optional(),
  budgetMax: z.number().int().min(0, 'Budget must be positive').optional(),
  timeline: TimelineSchema,
  source: SourceSchema,
  status: StatusSchema.default('NEW'),
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  tags: z.string().optional().default(''),
}).refine(
  (data) => {
    // BHK is required for Apartment and Villa
    if ((data.propertyType === 'APARTMENT' || data.propertyType === 'VILLA') && !data.bhk) {
      return false;
    }
    return true;
  },
  {
    message: 'BHK is required for Apartment and Villa properties',
    path: ['bhk'],
  }
).refine(
  (data) => {
    // BudgetMax must be >= BudgetMin if both are provided
    if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
      return false;
    }
    return true;
  },
  {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax'],
  }
);

// Schema for creating a new buyer
export const CreateBuyerSchema = BuyerSchema.omit({ status: true });

// Schema for updating a buyer
export const UpdateBuyerSchema = BuyerSchema.partial();

// Schema for CSV import validation
export const CSVBuyerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(80, 'Name must be at most 80 characters'),
  email: z.string().optional().refine(val => !val || val === '' || z.string().email().safeParse(val).success, {
    message: 'Invalid email format'
  }).transform(val => val === '' ? undefined : val),
  phone: z.string().min(10, 'Phone must be at least 10 digits').max(15, 'Phone must be at most 15 digits'),
  city: CitySchema,
  propertyType: PropertyTypeSchema,
  bhk: BhkSchema.optional(),
  purpose: PurposeSchema,
  budgetMin: z.string().optional().transform(val => {
    if (val === '' || !val) return undefined;
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
  }),
  budgetMax: z.string().optional().transform(val => {
    if (val === '' || !val) return undefined;
    const num = parseInt(val);
    return isNaN(num) ? undefined : num;
  }),
  timeline: TimelineSchema,
  source: SourceSchema,
  notes: z.string().max(1000, 'Notes must be at most 1000 characters').optional(),
  tags: z.string().optional().default(''),
}).refine(
  (data) => {
    // BHK is required for Apartment and Villa
    if ((data.propertyType === 'APARTMENT' || data.propertyType === 'VILLA') && !data.bhk) {
      return false;
    }
    return true;
  },
  {
    message: 'BHK is required for Apartment and Villa properties',
    path: ['bhk'],
  }
).refine(
  (data) => {
    // BudgetMax must be >= BudgetMin if both are provided
    if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
      return false;
    }
    return true;
  },
  {
    message: 'Maximum budget must be greater than or equal to minimum budget',
    path: ['budgetMax'],
  }
).refine(
  (data) => {
    // Validate budgetMin and budgetMax are valid numbers if provided
    if (data.budgetMin !== undefined && (isNaN(data.budgetMin) || data.budgetMin < 0)) {
      return false;
    }
    if (data.budgetMax !== undefined && (isNaN(data.budgetMax) || data.budgetMax < 0)) {
      return false;
    }
    return true;
  },
  {
    message: 'Budget values must be valid positive numbers',
  }
);

// Auth schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Types
export type Buyer = z.infer<typeof BuyerSchema>;
export type CreateBuyer = z.infer<typeof CreateBuyerSchema>;
export type UpdateBuyer = z.infer<typeof UpdateBuyerSchema>;
export type CSVBuyer = z.infer<typeof CSVBuyerSchema>;
export type LoginData = z.infer<typeof LoginSchema>;

// Helper function to validate CSV row
export function validateCSVRow(row: any, rowIndex: number): { success: true; data: CSVBuyer } | { success: false; error: string } {
  try {
    const data = CSVBuyerSchema.parse(row);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors?.map(err => `${err.path.join('.')}: ${err.message}`).join(', ') || 'Validation error';
      return { success: false, error: `Row ${rowIndex + 1}: ${errorMessage}` };
    }
    return { success: false, error: `Row ${rowIndex + 1}: Invalid data format` };
  }
}
