import { Router, Request, Response } from 'express'
import Restaurant from '../models/Restaurant'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

// GET /api/v1/restaurants — supports ?category=&search=
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (category) filter.category = category
    if (search) filter.name = { $regex: search, $options: 'i' }

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, count: restaurants.length, data: restaurants })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/restaurants/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) { res.status(404).json({ success: false, error: 'Restaurant not found' }); return }
    res.json({ success: true, data: restaurant })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/restaurants — admin only
router.post('/', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.create(req.body)
    res.status(201).json({ success: true, data: restaurant })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PUT /api/v1/restaurants/:id — admin only
router.put('/:id', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!restaurant) { res.status(404).json({ success: false, error: 'Restaurant not found' }); return }
    res.json({ success: true, data: restaurant })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/v1/restaurants/:id — admin only
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id)
    if (!restaurant) { res.status(404).json({ success: false, error: 'Restaurant not found' }); return }
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
