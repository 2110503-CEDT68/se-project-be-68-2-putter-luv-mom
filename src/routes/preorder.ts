import { Router, Request, Response } from 'express'
import PreOrder from '../models/PreOrder'

const router = Router()

// POST /api/v1/preorders/:venueId/items — add item to pre-order list
router.post('/:venueId/items', async (req: Request, res: Response): Promise<void> => {
  try {
    const { menuId, name, price, quantity } = req.body
    let preOrder = await PreOrder.findOne({ venueId: req.params.venueId })

    if (!preOrder) {
      preOrder = new PreOrder({ venueId: req.params.venueId, items: [] })
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

// GET /api/v1/preorders/:venueId — get current pre-order list for venue
router.get('/:venueId', async (req: Request, res: Response): Promise<void> => {
  try {
    const preOrder = await PreOrder.findOne({ venueId: req.params.venueId })
    if (!preOrder) {
      res.json({ success: true, data: { venueId: req.params.venueId, items: [], total: 0 } })
      return
    }
    res.json({ success: true, data: preOrder })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// DELETE /api/v1/preorders/:venueId/items/:menuId — remove item from pre-order
router.delete('/:venueId/items/:menuId', async (req: Request, res: Response): Promise<void> => {
  try {
    const preOrder = await PreOrder.findOne({ venueId: req.params.venueId })
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

// PUT /api/v1/preorders/:venueId/items/:menuId — update item quantity and recalculate total
router.put('/:venueId/items/:menuId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { quantity } = req.body
    if (typeof quantity !== 'number' || quantity < 1) {
      res.status(400).json({ success: false, error: 'quantity must be a positive integer' })
      return
    }

    const preOrder = await PreOrder.findOne({ venueId: req.params.venueId })
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

// PATCH /api/v1/preorders/:venueId — save/replace entire pre-order items array
router.patch('/:venueId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      res.status(400).json({ success: false, error: 'items must be an array' })
      return
    }

    const preOrder = await PreOrder.findOneAndUpdate(
      { venueId: req.params.venueId },
      { items },
      { new: true, runValidators: true, upsert: true }
    )

    await preOrder!.save()
    res.json({ success: true, data: preOrder })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

export default router
