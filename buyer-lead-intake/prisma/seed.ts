import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
    },
  })

  console.log('Created demo user:', demoUser.email)

  // Create sample buyers
  const sampleBuyers = [
    {
      fullName: 'Rajesh Kumar',
      email: 'rajesh.kumar@example.com',
      phone: '9876543210',
      city: 'CHANDIGARH' as const,
      propertyType: 'APARTMENT' as const,
      bhk: 'TWO' as const,
      purpose: 'BUY' as const,
      budgetMin: 5000000,
      budgetMax: 7000000,
      timeline: 'ZERO_TO_THREE_MONTHS' as const,
      source: 'WEBSITE' as const,
      status: 'NEW' as const,
      notes: 'Looking for a 2 BHK apartment in Chandigarh. Prefers furnished property.',
      tags: 'urgent,family',
      ownerId: demoUser.id,
    },
    {
      fullName: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '9876543211',
      city: 'MOHALI' as const,
      propertyType: 'VILLA' as const,
      bhk: 'THREE' as const,
      purpose: 'RENT' as const,
      budgetMin: 45000,
      budgetMax: 60000,
      timeline: 'THREE_TO_SIX_MONTHS' as const,
      source: 'REFERRAL' as const,
      status: 'QUALIFIED' as const,
      notes: 'Looking for a villa for rent. Must have parking space.',
      tags: 'referral,villa',
      ownerId: demoUser.id,
    },
    {
      fullName: 'Amit Singh',
      phone: '9876543212',
      city: 'ZIRAKPUR' as const,
      propertyType: 'PLOT' as const,
      purpose: 'BUY' as const,
      budgetMin: 3000000,
      budgetMax: 5000000,
      timeline: 'MORE_THAN_SIX_MONTHS' as const,
      source: 'WALK_IN' as const,
      status: 'CONTACTED' as const,
      notes: 'Interested in buying a plot for investment.',
      tags: 'investment,plot',
      ownerId: demoUser.id,
    },
    {
      fullName: 'Sunita Devi',
      email: 'sunita.devi@example.com',
      phone: '9876543213',
      city: 'PANCHKULA' as const,
      propertyType: 'OFFICE' as const,
      purpose: 'RENT' as const,
      budgetMin: 25000,
      budgetMax: 40000,
      timeline: 'EXPLORING' as const,
      source: 'CALL' as const,
      status: 'VISITED' as const,
      notes: 'Looking for office space for new business.',
      tags: 'office,business',
      ownerId: demoUser.id,
    },
    {
      fullName: 'Vikram Malhotra',
      email: 'vikram.malhotra@example.com',
      phone: '9876543214',
      city: 'CHANDIGARH' as const,
      propertyType: 'APARTMENT' as const,
      bhk: 'FOUR' as const,
      purpose: 'BUY' as const,
      budgetMin: 8000000,
      budgetMax: 12000000,
      timeline: 'ZERO_TO_THREE_MONTHS' as const,
      source: 'WEBSITE' as const,
      status: 'NEGOTIATION' as const,
      notes: 'Looking for a premium 4 BHK apartment. Budget is flexible.',
      tags: 'premium,flexible-budget',
      ownerId: demoUser.id,
    },
  ]

  for (const buyerData of sampleBuyers) {
    const buyer = await prisma.buyer.create({
      data: buyerData,
    })

    // Create initial history entry
    await prisma.buyerHistory.create({
      data: {
        buyerId: buyer.id,
        changedBy: demoUser.id,
        diff: {
          action: 'created',
          fields: buyerData,
        },
      },
    })

    console.log('Created buyer:', buyer.fullName)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
