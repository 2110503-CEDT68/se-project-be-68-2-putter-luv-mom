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

export default router
