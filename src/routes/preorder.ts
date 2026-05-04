import { Router, Request, Response } from 'express'
import PreOrder from '../models/PreOrder'
import Reservation from '../models/Reservation'
import { protect, adminOnly, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/v1/preorders — admin only, list all preorders across all venues
router.get('/', protect, adminOnly, async (_req: Request, res: Response): Promise<void> => {
  try {
    const preorders = await PreOrder.find({}).sort({ updatedAt: -1 })
    res.json({ success: true, count: preorders.length, data: preorders })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/preorders/mine — caller's own preorders across venues (used by /my-orders)
router.get('/mine', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (!userId) { res.status(401).json({ success: false, error: 'Not authenticated' }); return }
    const preorders = await PreOrder.find({ userId }).sort({ updatedAt: -1 })
    res.json({ success: true, count: preorders.length, data: preorders })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/preorders/:venueId/items — add item to caller's pre-order list for the venue
router.post('/:venueId/items', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (req.user?.role !== 'admin') {
      const reservation = await Reservation.findOne({
        userId,
        restaurantId: req.params.venueId,
        status: { $ne: 'cancelled' },
      })
      if (!reservation) {
        res.status(400).json({ success: false, error: 'You can only preorder from a restaurant you have reserved' })
        return
      }
    }

    const { menuId, name, price, quantity } = req.body
    let preOrder = await PreOrder.findOne({ userId, venueId: req.params.venueId })

    if (!preOrder) {
      preOrder = new PreOrder({ userId, venueId: req.params.venueId, items: [] })
    }

    const existing = preOrder.items.find(i => i.menuId === menuId)
    if (existing) {
      existing.quantity += quantity ?? 1
    } else {
      preOrder.items.push({ menuId, name, price, quantity: quantity ?? 1 })
    }

    await preOrder.save()
    res.status(201).json({ success: true, data: preOrder })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// GET /api/v1/preorders/:venueId — caller's pre-order list for the venue
router.get('/:venueId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const preOrder = await PreOrder.findOne({ userId, venueId: req.params.venueId })
    if (!preOrder) {
      res.json({ success: true, data: { userId, venueId: req.params.venueId, items: [], total: 0 } })
      return
    }
    res.json({ success: true, data: preOrder })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// DELETE /api/v1/preorders/:venueId/items/:menuId — remove item from caller's pre-order
router.delete('/:venueId/items/:menuId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    const preOrder = await PreOrder.findOne({ userId, venueId: req.params.venueId })
    if (!preOrder) { res.status(404).json({ success: false, error: 'Pre-order not found' }); return }

    const before = preOrder.items.length
    preOrder.items = preOrder.items.filter(i => i.menuId !== req.params.menuId) as typeof preOrder.items
    if (preOrder.items.length === before) {
      res.status(404).json({ success: false, error: 'Item not found in pre-order' })
      return
    }

    await preOrder.save()
    res.json({ success: true, data: preOrder })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// PUT /api/v1/preorders/:venueId/items/:menuId — update item quantity in caller's pre-order
router.put('/:venueId/items/:menuId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body
    if (typeof quantity !== 'number' || quantity < 1) {
      res.status(400).json({ success: false, error: 'quantity must be a positive integer' })
      return
    }

    const userId = req.user?.id
    const preOrder = await PreOrder.findOne({ userId, venueId: req.params.venueId })
    if (!preOrder) { res.status(404).json({ success: false, error: 'Pre-order not found' }); return }

    const item = preOrder.items.find(i => i.menuId === req.params.menuId)
    if (!item) { res.status(404).json({ success: false, error: 'Item not found in pre-order' }); return }

    item.quantity = quantity
    await preOrder.save()
    res.json({ success: true, data: preOrder })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PATCH /api/v1/preorders/:venueId — replace caller's items array (confirm order)
router.patch('/:venueId', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id
    if (req.user?.role !== 'admin') {
      const reservation = await Reservation.findOne({
        userId,
        restaurantId: req.params.venueId,
        status: { $ne: 'cancelled' },
      })
      if (!reservation) {
        res.status(400).json({ success: false, error: 'You can only preorder from a restaurant you have reserved' })
        return
      }
    }

    const { items } = req.body
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'items must be an array' })
      return
    }

    const preOrder = await PreOrder.findOneAndUpdate(
      { userId, venueId: req.params.venueId },
      { userId, venueId: req.params.venueId, items },
      { new: true, runValidators: true, upsert: true }
    )

    await preOrder!.save()
    res.json({ success: true, data: preOrder })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PATCH /api/v1/preorders/:venueId/items/:menuId/quantity — edit a single item quantity
router.patch('/:venueId/items/:menuId/quantity', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body
    if (typeof quantity !== 'number' || quantity < 1) {
      res.status(400).json({ success: false, error: 'quantity must be a positive integer' })
      return
    }

    const userId = req.user?.id
    const preOrder = await PreOrder.findOne({ userId, venueId: req.params.venueId })
    if (!preOrder) { res.status(404).json({ success: false, error: 'Pre-order not found' }); return }

    const item = preOrder.items.find(i => i.menuId === req.params.menuId)
    if (!item) { res.status(404).json({ success: false, error: 'Item not found in pre-order' }); return }

    item.quantity = quantity
    await preOrder.save()
    res.json({ success: true, data: preOrder })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

export default router
