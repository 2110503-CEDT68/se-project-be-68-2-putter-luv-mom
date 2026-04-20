import { Router, Request, Response } from 'express'
import Menu from '../models/Menu'

const router = Router()

// GET /api/v1/menus
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 })
    res.json({ success: true, count: menus.length, data: menus })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/menus/by-venue/:venueId
router.get('/by-venue/:venueId', async (req: Request, res: Response): Promise<void> => {
  try {
    const menus = await Menu.find({ venueId: req.params.venueId }).sort({ category: 1, name: 1 })
    res.json({ success: true, count: menus.length, data: menus })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/menus
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.create(req.body)
    res.status(201).json({ success: true, data: menu })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PUT /api/v1/menus/:id
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!menu) { res.status(404).json({ success: false, error: 'Menu not found' }); return }
    res.json({ success: true, data: menu })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/v1/menus/:id
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id)
    if (!menu) { res.status(404).json({ success: false, error: 'Menu not found' }); return }
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
