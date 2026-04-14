import { Router, Request, Response } from 'express'
import Menu from '../models/Menu'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

// GET /api/v1/menus — supports ?category=&search=&sort=price_asc|price_desc|name_asc|name_desc
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, sort } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (category) filter.category = category
    if (search) filter.name = { $regex: search, $options: 'i' }

    let query = Menu.find(filter)

    if (sort === 'price_asc') query = query.sort({ price: 1 })
    else if (sort === 'price_desc') query = query.sort({ price: -1 })
    else if (sort === 'name_asc') query = query.sort({ name: 1 })
    else if (sort === 'name_desc') query = query.sort({ name: -1 })
    else query = query.sort({ createdAt: -1 })

    const menus = await query
    res.json({ success: true, count: menus.length, data: menus })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/menus/by-venue/:venueId — supports same filter/sort query params
router.get('/by-venue/:venueId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, sort } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = { venueId: req.params.venueId }
    if (category) filter.category = category
    if (search) filter.name = { $regex: search, $options: 'i' }

    let query = Menu.find(filter)

    if (sort === 'price_asc') query = query.sort({ price: 1 })
    else if (sort === 'price_desc') query = query.sort({ price: -1 })
    else if (sort === 'name_asc') query = query.sort({ name: 1 })
    else query = query.sort({ category: 1, name: 1 })

    const menus = await query
    res.json({ success: true, count: menus.length, data: menus })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/menus — admin only
router.post('/', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.create(req.body)
    res.status(201).json({ success: true, data: menu })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PUT /api/v1/menus/:id — admin only
router.put('/:id', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!menu) { res.status(404).json({ success: false, error: 'Menu not found' }); return }
    res.json({ success: true, data: menu })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/v1/menus/:id — admin only
router.delete('/:id', protect, adminOnly, async (req: Request, res: Response): Promise<void> => {
  try {
    const menu = await Menu.findByIdAndDelete(req.params.id)
    if (!menu) { res.status(404).json({ success: false, error: 'Menu not found' }); return }
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
