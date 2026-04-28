import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db';
import { AuthRequest } from '../middlewares/authMiddleware';

export const register = async (req: Request, res: Response) => {
  try {
    console.log("REGISTER BODY:", req.body); // ✅ DEBUG

    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'ADMIN' ? 'ADMIN' : 'CANDIDATE';

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: userRole
      }
    });

    // ✅ SAFETY CHECK
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("REGISTER ERROR:", error); // ✅ IMPORTANT
    res.status(500).json({ error: error?.message || error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    console.log("LOGIN BODY:", req.body); // ✅ DEBUG

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // ✅ SAFETY CHECK
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("LOGIN ERROR:", error); // ✅ IMPORTANT
    res.status(500).json({ error: error?.message || error });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user?.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error: any) {
    console.error("GETME ERROR:", error);
    res.status(500).json({ error: error?.message || error });
  }
};