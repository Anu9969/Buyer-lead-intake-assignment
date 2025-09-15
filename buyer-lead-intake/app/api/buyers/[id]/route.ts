import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { UpdateBuyerSchema } from '@/lib/validation';

// GET /api/buyers/[id] - Get buyer by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    const buyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        history: {
          include: {
            buyer: {
              select: { id: true, fullName: true }
            }
          },
          orderBy: { changedAt: 'desc' },
          take: 5,
        }
      }
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(buyer);
  } catch (error) {
    console.error('Error fetching buyer:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buyer' },
      { status: 500 }
    );
  }
}

// PUT /api/buyers/[id] - Update buyer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    const body = await request.json();
    const { updatedAt, ...updateData } = UpdateBuyerSchema.parse(body);

    // Check if buyer exists and user owns it
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true, updatedAt: true }
    });

    if (!existingBuyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    if (existingBuyer.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own buyers' },
        { status: 403 }
      );
    }

    // Concurrency check
    if (updatedAt && new Date(updatedAt).getTime() !== existingBuyer.updatedAt.getTime()) {
      return NextResponse.json(
        { error: 'Buyer has been modified by another user. Please refresh and try again.' },
        { status: 409 }
      );
    }

    // Get old data for history
    const oldBuyer = await prisma.buyer.findUnique({
      where: { id: params.id }
    });

    // Update buyer with history
    const updatedBuyer = await prisma.$transaction(async (tx) => {
      const buyer = await tx.buyer.update({
        where: { id: params.id },
        data: updateData,
        include: {
          owner: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      // Create history entry with diff
      const diff: any = {};
      Object.keys(updateData).forEach(key => {
        if (oldBuyer && oldBuyer[key as keyof typeof oldBuyer] !== updateData[key as keyof typeof updateData]) {
          diff[key] = {
            old: oldBuyer[key as keyof typeof oldBuyer],
            new: updateData[key as keyof typeof updateData]
          };
        }
      });

      if (Object.keys(diff).length > 0) {
        await tx.buyerHistory.create({
          data: {
            buyerId: params.id,
            changedBy: user.id,
            diff: {
              action: 'updated',
              fields: diff,
            },
          },
        });
      }

      return buyer;
    });

    return NextResponse.json(updatedBuyer);
  } catch (error) {
    console.error('Error updating buyer:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'Invalid buyer data' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update buyer' },
      { status: 500 }
    );
  }
}

// DELETE /api/buyers/[id] - Delete buyer
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    
    // Check if buyer exists and user owns it
    const existingBuyer = await prisma.buyer.findUnique({
      where: { id: params.id },
      select: { id: true, ownerId: true }
    });

    if (!existingBuyer) {
      return NextResponse.json(
        { error: 'Buyer not found' },
        { status: 404 }
      );
    }

    if (existingBuyer.ownerId !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own buyers' },
        { status: 403 }
      );
    }

    await prisma.buyer.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    console.error('Error deleting buyer:', error);
    return NextResponse.json(
      { error: 'Failed to delete buyer' },
      { status: 500 }
    );
  }
}
