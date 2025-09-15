import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const DEMO_USER_EMAIL = process.env.DEMO_USER_EMAIL || 'demo@example.com';
const DEMO_USER_PASSWORD = process.env.DEMO_USER_PASSWORD || 'demo123';

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
}

// Create demo user if it doesn't exist
export async function ensureDemoUser() {
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL }
  });

  if (!existingUser) {
    const hashedPassword = await bcrypt.hash(DEMO_USER_PASSWORD, 10);
    await prisma.user.create({
      data: {
        email: DEMO_USER_EMAIL,
        name: 'Demo User',
        // Note: We're not storing password in the simplified version
        // In production, you'd have a password field in the User model
      }
    });
  }
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Get user from request
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('auth-token')?.value;
  
  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });

  return user;
}

// Login function
export async function login(email: string, password: string): Promise<{ user: User; token: string } | null> {
  // For demo purposes, we'll use hardcoded credentials
  // In production, you'd check against the database
  if (email === DEMO_USER_EMAIL && password === DEMO_USER_PASSWORD) {
    const user = await prisma.user.findUnique({
      where: { email: DEMO_USER_EMAIL }
    });

    if (!user) {
      await ensureDemoUser();
      const newUser = await prisma.user.findUnique({
        where: { email: DEMO_USER_EMAIL }
      });
      if (newUser) {
        const token = generateToken({ userId: newUser.id, email: newUser.email });
        return { user: newUser, token };
      }
    } else {
      const token = generateToken({ userId: user.id, email: user.email });
      return { user, token };
    }
  }

  return null;
}

// Middleware to check authentication
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getUserFromRequest(request);
  
  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}
