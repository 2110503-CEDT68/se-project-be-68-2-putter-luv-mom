import { Router, Request, Response } from 'express'
import Restaurant from '../models/Restaurant'
import Review from '../models/Review'
import { protect, adminOnly } from '../middleware/auth'

const router = Router()

type Aggregated = { _id: string; avg: number; count: number }

async function withRatings(restaurants: any[]): Promise<any[]> {
  if (restaurants.length === 0) return []
  const ids = restaurants.map(r => String(r._id))
  const rows = await Review.aggregate<Aggregated>([
    { $match: { restaurantId: { $in: ids } } },
    { $group: { _id: '$restaurantId', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  const map = new Map(rows.map(r => [String(r._id), r]))
  return restaurants.map(r => {
    const obj = typeof r.toObject === 'function' ? r.toObject() : r
    const stats = map.get(String(obj._id))
    return {
      ...obj,
      tel: obj.phone ?? obj.tel ?? '',
      averageRating: stats ? Number(stats.avg.toFixed(2)) : 0,
      reviewCount: stats?.count ?? 0,
    }
  })
}

// GET /api/v1/restaurants — supports ?category=&search=&province=&district=&sort=
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, province, district, sort } = req.query as Record<string, string | undefined>

    const filter: Record<string, unknown> = {}
    if (category) filter.category = category
    if (province) filter.province = { $regex: province, $options: 'i' }
    if (district) filter.district = { $regex: district, $options: 'i' }
    if (search) filter.name = { $regex: search, $options: 'i' }

    const restaurants = await Restaurant.find(filter).sort({ createdAt: -1 })
    let enriched = await withRatings(restaurants)

    if (sort === 'rating_desc') enriched.sort((a, b) => b.averageRating - a.averageRating)
    else if (sort === 'rating_asc') enriched.sort((a, b) => a.averageRating - b.averageRating)
    else if (sort === 'name_asc') enriched.sort((a, b) => String(a.name).localeCompare(String(b.name)))
    else if (sort === 'name_desc') enriched.sort((a, b) => String(b.name).localeCompare(String(a.name)))

    res.json({ success: true, count: enriched.length, data: enriched })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/restaurants/:id
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
    if (!restaurant) { res.status(404).json({ success: false, error: 'Restaurant not found' }); return }
    const [enriched] = await withRatings([restaurant])
    res.json({ success: true, data: enriched })
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
