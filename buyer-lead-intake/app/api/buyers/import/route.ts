import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { validateCSVRow } from '@/lib/validation';
import csv from 'csv-parser';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      );
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const csvContent = Buffer.from(buffer).toString('utf-8');
    
    // Parse CSV
    const rows: any[] = [];
    const stream = Readable.from([csvContent]);
    
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({ headers: true }))
        .on('data', (row) => rows.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // Check row limit
    if (rows.length > 200) {
      return NextResponse.json(
        { error: 'Maximum 200 rows allowed per import' },
        { status: 400 }
      );
    }

    // Validate each row
    const validationResults = rows.map((row, index) => validateCSVRow(row, index));
    const validRows = validationResults.filter(result => result.success);
    const invalidRows = validationResults.filter(result => !result.success);

    // If there are validation errors, return them
    if (invalidRows.length > 0) {
      return NextResponse.json({
        success: false,
        errors: invalidRows.map(result => result.error),
        validCount: validRows.length,
        invalidCount: invalidRows.length,
      }, { status: 400 });
    }

    // Insert valid rows in transaction
    const createdBuyers = await prisma.$transaction(async (tx) => {
      const buyers = [];
      
      for (const result of validRows) {
        if (result.success) {
          const buyer = await tx.buyer.create({
            data: {
              ...result.data,
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
              buyerId: buyer.id,
              changedBy: user.id,
              diff: {
                action: 'imported',
                fields: result.data,
              },
            },
          });

          buyers.push(buyer);
        }
      }
      
      return buyers;
    });

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdBuyers.length} buyers`,
      count: createdBuyers.length,
    });
  } catch (error) {
    console.error('Error importing buyers:', error);
    return NextResponse.json(
      { error: 'Failed to import buyers' },
      { status: 500 }
    );
  }
}
