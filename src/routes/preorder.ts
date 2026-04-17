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

export default router
