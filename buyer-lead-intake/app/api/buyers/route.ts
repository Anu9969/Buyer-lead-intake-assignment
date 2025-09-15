import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { CreateBuyerSchema } from '@/lib/validation';

// GET /api/buyers - List buyers with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const propertyType = searchParams.get('propertyType') || '';
    const status = searchParams.get('status') || '';
    const timeline = searchParams.get('timeline') || '';
    
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (city) where.city = city;
    if (propertyType) where.propertyType = propertyType;
    if (status) where.status = status;
    if (timeline) where.timeline = timeline;

    const [buyers, total] = await Promise.all([
      prisma.buyer.findMany({
        where,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.buyer.count({ where }),
    ]);

    return NextResponse.json({
      buyers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyers' },
      { status: 500 }
    );
  }
}

// POST /api/buyers - Create new buyer
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const body = await request.json();
    const buyerData = CreateBuyerSchema.parse(body);

    // Create buyer with history
    const buyer = await prisma.$transaction(async (tx) => {
      const newBuyer = await tx.buyer.create({
        data: {
          ...buyerData,
          ownerId: user.id,
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Create history entry
      await tx.buyerHistory.create({
        data: {
          buyerId: newBuyer.id,
          changedBy: user.id,
          diff: {
            action: 'created',
            fields: buyerData,
          },
        },
      });

      return newBuyer;
    });

    return NextResponse.json(buyer, { status: 201 });
  } catch (error) {
    console.error('Error creating buyer:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid buyer data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create buyer' },
      { status: 500 }
    );
  }
}
