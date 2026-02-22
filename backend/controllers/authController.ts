
import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'tradepulse_secret_key_123';
const JWT_EXPIRE = '30d';

const generateToken = (id: string, email: string) => {
  return jwt.sign({ id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = (req as any).body;
    if (!email || !password) {
      return (res as any).status(400).json({ message: 'Email and password are required' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return (res as any).status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      cashBalance: 100000,
    });

    if (!user) throw new Error("User creation failed");

    const token = generateToken((user._id as any).toString(), user.email);

    (res as any).status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cashBalance: user.cashBalance,
      },
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    (res as any).status(500).json({ message: error.message || 'Internal server error during registration' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = (req as any).body;
    if (!email || !password) {
      return (res as any).status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return (res as any).status(401).json({ message: 'Invalid credentials. User not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return (res as any).status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    const token = generateToken((user._id as any).toString(), user.email);

    (res as any).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        cashBalance: user.cashBalance,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    (res as any).status(500).json({ message: error.message || 'Internal server error during login' });
  }
};

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return (res as any).status(404).json({ message: 'User identity not found' });
    }
    (res as any).json(user);
  } catch (error: any) {
    (res as any).status(500).json({ message: error.message });
  }
};
