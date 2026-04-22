import { Router, Request, Response } from 'express'
import Reservation from '../models/Reservation'
import { protect, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/v1/reservations — get all (admin) or own reservations (user)
router.get('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: Record<string, unknown> =
      req.user?.role === 'admin' ? {} : { userId: req.user?.id }

    const reservations = await Reservation.find(filter).sort({ date: 1 })
    res.json({ success: true, count: reservations.length, data: reservations })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// GET /api/v1/reservations/:id
router.get('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return }

    if (req.user?.role !== 'admin' && reservation.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized' })
      return
    }

    res.json({ success: true, data: reservation })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

// POST /api/v1/reservations — authenticated users
router.post('/', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.create({ ...req.body, userId: req.user?.id })
    res.status(201).json({ success: true, data: reservation })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// PUT /api/v1/reservations/:id — owner or admin
router.put('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return }

    if (req.user?.role !== 'admin' && reservation.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized' })
      return
    }

    const updated = await Reservation.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    res.json({ success: true, data: updated })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Invalid data'
    res.status(400).json({ success: false, error: msg })
  }
})

// DELETE /api/v1/reservations/:id — owner or admin
router.delete('/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const reservation = await Reservation.findById(req.params.id)
    if (!reservation) { res.status(404).json({ success: false, error: 'Reservation not found' }); return }

    if (req.user?.role !== 'admin' && reservation.userId !== req.user?.id) {
      res.status(403).json({ success: false, error: 'Not authorized' })
      return
    }

    await Reservation.findByIdAndDelete(req.params.id)
    res.json({ success: true, data: {} })
  } catch {
    res.status(500).json({ success: false, error: 'Server error' })
  }
})

export default router
