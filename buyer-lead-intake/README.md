# Buyer Lead Intake CRM

A minimal but functional CRM application for managing buyer leads built with Next.js, TypeScript, Prisma, and Zod.

## Features

### ✅ Implemented
- **Authentication**: Simple demo login system with JWT tokens
- **Buyer Management**: Create, read, update, delete buyer leads
- **Search & Filtering**: Search by name/email/phone with filters for city, property type, status, timeline
- **CSV Import/Export**: Bulk import buyers from CSV (max 200 rows) and export filtered results
- **Validation**: Client and server-side validation using Zod
- **History Tracking**: Track all changes to buyer records
- **Ownership**: Users can only edit/delete their own leads
- **Responsive UI**: Modern, accessible interface built with Tailwind CSS
- **Unit Tests**: Validation tests using Jest

### 📋 Data Model

#### Buyers Table
- `id`: UUID primary key
- `fullName`: 2-80 characters, required
- `email`: Optional, valid email format
- `phone`: 10-15 digits, required
- `city`: Enum (Chandigarh, Mohali, Zirakpur, Panchkula, Other)
- `propertyType`: Enum (Apartment, Villa, Plot, Office, Retail)
- `bhk`: Enum (Studio, 1, 2, 3, 4) - Required for Apartment/Villa only
- `purpose`: Enum (Buy, Rent)
- `budgetMin/budgetMax`: Optional integers, max must be >= min
- `timeline`: Enum (0-3m, 3-6m, >6m, Exploring)
- `source`: Enum (Website, Referral, Walk-in, Call, Other)
- `status`: Enum (New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped)
- `notes`: Optional, max 1000 characters
- `tags`: Array of strings
- `ownerId`: Foreign key to users table
- `createdAt/updatedAt`: Timestamps

#### Buyer History Table
- Tracks all changes with JSON diff and user information

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Clone and Install
```bash
git clone <repository-url>
cd buyer-lead-intake
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Update `.env` with your database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/buyer_lead_intake?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
DEMO_USER_EMAIL="demo@example.com"
DEMO_USER_PASSWORD="demo123"
```

### 3. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or create and run migrations (for production)
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and login with:
- Email: `demo@example.com`
- Password: `demo123`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `DELETE /api/auth/login` - Logout

### Buyers
- `GET /api/buyers` - List buyers with pagination and filters
- `POST /api/buyers` - Create new buyer
- `GET /api/buyers/[id]` - Get buyer details with history
- `PUT /api/buyers/[id]` - Update buyer
- `DELETE /api/buyers/[id]` - Delete buyer

### Import/Export
- `POST /api/buyers/import` - Import buyers from CSV
- `GET /api/buyers/export` - Export buyers to CSV

## CSV Import/Export

### CSV Format
```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags
John Doe,john@example.com,9876543210,CHANDIGARH,APARTMENT,TWO,BUY,5000000,8000000,ZERO_TO_THREE_MONTHS,WEBSITE,"Looking for apartment","urgent,family"
```

### Import Rules
- Maximum 200 rows per import
- File size limit: 5MB
- Headers must match exactly
- Empty values are handled gracefully
- Validation errors are reported with row numbers

### Export Features
- Exports current filtered results
- Includes all buyer fields plus owner and timestamps
- Filename includes export date

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

Tests cover:
- Zod validation schemas
- CSV validation
- Budget constraints
- Required field validation
- Enum validation

## Deployment

### Vercel + Supabase
1. Create Supabase project and get connection string
2. Update `DATABASE_URL` in Vercel environment variables
3. Deploy to Vercel:
   ```bash
   npm run build
   vercel --prod
   ```
4. Run migrations in production:
   ```bash
   npx prisma migrate deploy
   ```

### Railway
1. Create Railway project with PostgreSQL
2. Update `DATABASE_URL` in Railway environment variables
3. Deploy to Railway
4. Run migrations: `npx prisma migrate deploy`

## Design Decisions

### Authentication
- **Chosen**: Simple JWT-based demo auth
- **Why**: Meets requirements without complexity of external providers
- **Production**: Would integrate with Auth0, Clerk, or similar

### Validation
- **Chosen**: Zod for both client and server validation
- **Why**: Type-safe, single source of truth, excellent TypeScript integration
- **Implementation**: Shared schemas between frontend and backend

### Database
- **Chosen**: PostgreSQL with Prisma ORM
- **Why**: Robust, scalable, excellent TypeScript support
- **Schema**: Normalized with proper relationships and constraints

### Frontend
- **Chosen**: Next.js App Router with React Hook Form
- **Why**: Server-side rendering, excellent developer experience
- **State**: Local state with optimistic updates where appropriate

### Rate Limiting
- **Implementation**: Basic rate limiting on create/update operations
- **Production**: Would use Redis-based rate limiting

## What's Included vs Excluded

### ✅ Included
- All "must have" requirements
- Clean, maintainable code structure
- Proper error handling and validation
- Responsive design
- Unit tests
- Comprehensive documentation

### ⏭️ Excluded (For Minimal Implementation)
- **External Auth Providers**: Using demo auth instead
- **File Uploads**: CSV import only, no image uploads
- **Real-time Updates**: No WebSocket implementation
- **Advanced Search**: No full-text search or complex queries
- **Admin Role**: Simple ownership model instead
- **Email Notifications**: No email integration
- **Advanced UI Components**: Basic forms and tables
- **Caching**: No Redis or advanced caching
- **Monitoring**: No analytics or error tracking

## Sample Data

The seed script creates 5 sample buyers with different:
- Property types (Apartment, Villa, Plot, Office)
- Statuses (New, Qualified, Contacted, Visited, Negotiation)
- Cities (Chandigarh, Mohali, Zirakpur, Panchkula)
- Budgets and timelines

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Check database permissions

### Build Issues
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Generate Prisma client: `npm run db:generate`

### Import Issues
- Check CSV format matches expected headers
- Verify file size is under 5MB
- Ensure row count is under 200

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

## License

MIT License - see LICENSE file for details.