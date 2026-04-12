import { Router, Response } from 'express'
import Menu from '../models/Menu'
import { protect, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/v1/menus — all menus (admin)
router.get('/', protect, adminOnly, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 })
    res.json({ success: true, count: menus.length, data: menus })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/restaurants/:venueId/menus — menus for a specific venue (public)
router.get('/by-venue/:venueId', async (req, res: Response): Promise<void> => {
  try {
    const menus = await Menu.find({ venueId: req.params.venueId }).sort({ category: 1, name: 1 })
    res.json({ success: true, count: menus.length, data: menus })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/menus — create menu (admin)
router.post('/', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menu = await Menu.create(req.body)
    res.status(201).json({ success: true, data: menu })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message })
    } else {
      res.status(400).json({ success: false, error: 'Invalid data' })
    }
  }
})

// PUT /api/v1/menus/:id — update menu (admin)
router.put('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' })
      return
    }
    res.json({ success: true, data: menu })
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(400).json({ success: false, error: error.message })
    } else {
      res.status(400).json({ success: false, error: 'Invalid data' })
    }
  }
})

// DELETE /api/v1/menus/:id — delete menu (admin)
router.delete('/:id', protect, adminOnly, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id)
    if (!menu) {
      res.status(404).json({ success: false, error: 'Menu not found' })
      return
    }
    res.json({ success: true, data: {} })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
