import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User'

const router = Router()

const signToken = (id: string, role: string): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET not configured')
  return jwt.sign({ id, role }, secret, { expiresIn: '7d' })
}

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role } = req.body
    const existing = await User.findOne({ email })
    if (existing) {
      res.status(400).json({ success: false, error: 'Email already registered' })
      return
    }

    const user = await User.create({ name, email, password, role })
    const token = signToken(String(user._id), user.role)
    res.status(201).json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user || !(await user.matchPassword(password))) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const token = signToken(String(user._id), user.role)
    res.json({ success: true, token, data: { id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error'
    res.status(500).json({ success: false, error: msg })
  }
})

export default router
