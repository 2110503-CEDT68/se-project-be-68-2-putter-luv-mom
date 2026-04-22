import { Router, Request, Response } from 'express'
import Review from '../models/Review'
import { protect, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/v1/reviews — supports ?restaurantId=
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { restaurantId } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (restaurantId) filter.restaurantId = restaurantId

    const reviews = await Review.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, count: reviews.length, data: reviews })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/reviews/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) { res.status(404).json({ success: false, error: 'Review not found' }); return }
    res.json({ success: true, data: review })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/reviews — authenticated users
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.create({ ...req.body, userId: req.user?.id })
    res.status(201).json({ success: true, data: review })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PUT /api/v1/reviews/:id — owner or admin
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) { res.status(404).json({ success: false, error: 'Review not found' }); return }

    if (req.user?.role !== 'admin' && review.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized' })
      return
    }

    const updated = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/v1/reviews/:id — owner or admin
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const review = await Review.findById(req.params.id)
    if (!review) { res.status(404).json({ success: false, error: 'Review not found' }); return }

    if (req.user?.role !== 'admin' && review.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized' })
      return
    }

    await Review.findByIdAndDelete(req.params.id)
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// DELETE /api/v1/reviews/:id — admin only (alias kept for admin panel convenience)
router.delete('/:id/admin', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id)
    if (!review) { res.status(404).json({ success: false, error: 'Review not found' }); return }
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
