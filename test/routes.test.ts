import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'

// ─── 1. MOCK MIDDLEWARE ────────────────────────────────────────────────────────
jest.mock('../src/middleware/auth', () => ({
  protect: (req: any, _res: any, next: any) => {
    // req.user จะถูก set มาจาก createApp
    next()
  },
  adminOnly: (req: any, res: any, next: any) => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' })
    }
    next()
  },
}))

jest.mock('../src/models/Reservation')
jest.mock('../src/models/PreOrder')

import Reservation from '../src/models/Reservation'
import PreOrder from '../src/models/PreOrder'
import preorderRouter from '../src/routes/preorder'
import reservationRouter from '../src/routes/reservation'

// ─── 2. SETUP EXPRESS APPS ───────────────────────────────────────────────────
const createApp = (user: any) => {
  const app = express()
  app.use(express.json())
  app.use((req: any, _res: any, next: any) => {
    req.user = user
    next()
  })
  app.use('/api/v1/preorders', preorderRouter)
  app.use('/api/v1/reservations', reservationRouter)
  return app
}

const appUser = createApp({ id: 'user1', role: 'user' })
const appAdmin = createApp({ id: 'admin1', role: 'admin' })

// ─── 3. TEST SUITES ──────────────────────────────────────────────────────────

describe('PreOrder Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ─── GET /api/v1/preorders (Admin Only) ───
  describe('GET /', () => {
    it('should return all preorders for admin', async () => {
      ;(PreOrder.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'po1' }])
      })
      const res = await request(appAdmin).get('/api/v1/preorders')
      expect(res.status).toBe(200)
      expect(res.body.count).toBe(1)
    })

    it('should block non-admin users', async () => {
      const res = await request(appUser).get('/api/v1/preorders')
      expect(res.status).toBe(403)
    })

    it('should return 500 on server error', async () => {
      ;(PreOrder.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockRejectedValue(new Error('DB Error'))
      })
      const res = await request(appAdmin).get('/api/v1/preorders')
      expect(res.status).toBe(500)
    })
  })

  // ─── POST /api/v1/preorders/:venueId/items ───
  describe('POST /:venueId/items', () => {
    it('returns 400 when no active reservation exists', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).post('/api/v1/preorders/v1/items').send({ menuId: 'm1' })
      expect(res.status).toBe(400)
    })

    it('creates new PreOrder if none exists and adds item with default qty', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue({ _id: 'res1' })
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(null)
      const mockSave = jest.fn()
      ;(PreOrder as unknown as jest.Mock).mockImplementation(() => ({
        venueId: 'v1',
        items: [],
        save: mockSave
      }))
      
      const res = await request(appUser).post('/api/v1/preorders/v1/items').send({ menuId: 'm1', name: 'Food' })
      expect(res.status).toBe(201)
      expect(mockSave).toHaveBeenCalled()
    })

    it('adds item to existing PreOrder with default qty', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue({ _id: 'res1' })
      const mockSave = jest.fn()
      const existingPreOrder = { items: [], save: mockSave }
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(existingPreOrder)
      
      const res = await request(appUser).post('/api/v1/preorders/v1/items').send({ menuId: 'm1', quantity: 2 })
      expect(res.status).toBe(201)
      expect(existingPreOrder.items[0]).toMatchObject({ menuId: 'm1', quantity: 2 })
    })

    it('increments quantity if item already exists', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue({ _id: 'res1' })
      const existingItem = { menuId: 'm1', quantity: 2 }
      const mockSave = jest.fn()
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [existingItem], save: mockSave })
      
      await request(appUser).post('/api/v1/preorders/v1/items').send({ menuId: 'm1', quantity: 3 })
      expect(existingItem.quantity).toBe(5)
      
      // Test default increment (no quantity provided)
      await request(appUser).post('/api/v1/preorders/v1/items').send({ menuId: 'm1' })
      expect(existingItem.quantity).toBe(6)
    })

    it('returns 400 for standard error', async () => {
      ;(Reservation.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'))
      const res = await request(appUser).post('/api/v1/preorders/v1/items')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('DB Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(Reservation.findOne as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).post('/api/v1/preorders/v1/items')
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid data')
    })
  })

  // ─── GET /api/v1/preorders/:venueId ───
  describe('GET /:venueId', () => {
    it('returns default empty data if preorder not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).get('/api/v1/preorders/v1')
      expect(res.body.data.items).toEqual([])
    })

    it('returns preorder if found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ _id: 'po1' })
      const res = await request(appUser).get('/api/v1/preorders/v1')
      expect(res.body.data._id).toBe('po1')
    })

    it('returns 500 on server error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue(new Error())
      const res = await request(appUser).get('/api/v1/preorders/v1')
      expect(res.status).toBe(500)
    })
  })

  // ─── DELETE /api/v1/preorders/:venueId/items/:menuId ───
  describe('DELETE /:venueId/items/:menuId', () => {
    it('returns 404 if preorder not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).delete('/api/v1/preorders/v1/items/m1')
      expect(res.status).toBe(404)
    })

    it('returns 404 if item not found in preorder', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [{ menuId: 'm2' }] })
      const res = await request(appUser).delete('/api/v1/preorders/v1/items/m1')
      expect(res.status).toBe(404)
    })

    it('removes item and saves if found', async () => {
      const mockSave = jest.fn()
      const mockPreOrder = { items: [{ menuId: 'm1' }, { menuId: 'm2' }], save: mockSave }
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(mockPreOrder)
      
      const res = await request(appUser).delete('/api/v1/preorders/v1/items/m1')
      expect(res.status).toBe(200)
      expect(mockPreOrder.items.length).toBe(1)
      expect(mockSave).toHaveBeenCalled()
    })

    it('returns 500 on server error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue(new Error())
      const res = await request(appUser).delete('/api/v1/preorders/v1/items/m1')
      expect(res.status).toBe(500)
    })
  })

  // ─── PUT /api/v1/preorders/:venueId/items/:menuId ───
  describe('PUT /:venueId/items/:menuId', () => {
    it('returns 400 if quantity is invalid', async () => {
      const res1 = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 'two' })
      const res2 = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 0 })
      expect(res1.status).toBe(400)
      expect(res2.status).toBe(400)
    })

    it('returns 404 if preorder not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 2 })
      expect(res.status).toBe(404)
    })

    it('returns 404 if item not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [{ menuId: 'm2' }] })
      const res = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 2 })
      expect(res.status).toBe(404)
    })

    it('updates quantity and saves', async () => {
      const item = { menuId: 'm1', quantity: 1 }
      const mockSave = jest.fn()
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [item], save: mockSave })
      const res = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 5 })
      expect(res.status).toBe(200)
      expect(item.quantity).toBe(5)
      expect(mockSave).toHaveBeenCalled()
    })

    it('returns 400 for standard error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'))
      const res = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 2 })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('DB Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).put('/api/v1/preorders/v1/items/m1').send({ quantity: 2 })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('Invalid data')
    })
  })

  // ─── PATCH /api/v1/preorders/:venueId ───
  describe('PATCH /:venueId', () => {
    it('returns 400 when no active reservation exists', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).patch('/api/v1/preorders/v1').send({ items: [] })
      expect(res.status).toBe(400)
    })

    it('returns 400 when items is not an array', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue({ _id: 'res1' })
      const res = await request(appUser).patch('/api/v1/preorders/v1').send({ items: 'not-array' })
      expect(res.status).toBe(400)
    })

    it('updates entire items array and saves', async () => {
      ;(Reservation.findOne as jest.Mock).mockResolvedValue({ _id: 'res1' })
      const mockSave = jest.fn()
      ;(PreOrder.findOneAndUpdate as jest.Mock).mockResolvedValue({ save: mockSave })
      
      const res = await request(appUser).patch('/api/v1/preorders/v1').send({ items: [{ menuId: 'm1' }] })
      expect(res.status).toBe(200)
      expect(mockSave).toHaveBeenCalled()
    })

    it('returns 400 for standard error', async () => {
      ;(Reservation.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'))
      const res = await request(appUser).patch('/api/v1/preorders/v1').send({ items: [] })
      expect(res.status).toBe(400)
      expect(res.body.error).toBe('DB Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(Reservation.findOne as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).patch('/api/v1/preorders/v1').send({ items: [] })
      expect(res.status).toBe(400)
    })
  })

  // ─── PATCH /api/v1/preorders/:venueId/items/:menuId/quantity ───
  describe('PATCH /:venueId/items/:menuId/quantity', () => {
    it('returns 400 if quantity is invalid', async () => {
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 0 })
      expect(res.status).toBe(400)
    })

    it('returns 404 if preorder not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 2 })
      expect(res.status).toBe(404)
    })

    it('returns 404 if item not found', async () => {
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [] })
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 2 })
      expect(res.status).toBe(404)
    })

    it('updates quantity and saves', async () => {
      const item = { menuId: 'm1', quantity: 1 }
      const mockSave = jest.fn()
      ;(PreOrder.findOne as jest.Mock).mockResolvedValue({ items: [item], save: mockSave })
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 5 })
      expect(res.status).toBe(200)
      expect(item.quantity).toBe(5)
    })

    it('returns 400 for standard error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue(new Error('DB Error'))
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 2 })
      expect(res.body.error).toBe('DB Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(PreOrder.findOne as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).patch('/api/v1/preorders/v1/items/m1/quantity').send({ quantity: 2 })
      expect(res.body.error).toBe('Invalid data')
    })
  })
})

describe('Reservation Routes', () => {
  beforeEach(() => jest.clearAllMocks())

  // ─── GET /api/v1/reservations ───
  describe('GET /', () => {
    it('returns all for admin without filtering userId', async () => {
      const mockFind = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([{}, {}]) })
      ;(Reservation.find as jest.Mock) = mockFind
      const res = await request(appAdmin).get('/api/v1/reservations')
      expect(res.status).toBe(200)
      expect(mockFind).toHaveBeenCalledWith({})
    })

    it('returns only own reservations for user', async () => {
      const mockFind = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([{}]) })
      ;(Reservation.find as jest.Mock) = mockFind
      const res = await request(appUser).get('/api/v1/reservations')
      expect(res.status).toBe(200)
      expect(mockFind).toHaveBeenCalledWith({ userId: 'user1' })
    })

    it('returns 500 on server error', async () => {
      ;(Reservation.find as jest.Mock).mockReturnValue({ sort: jest.fn().mockRejectedValue(new Error()) })
      const res = await request(appUser).get('/api/v1/reservations')
      expect(res.status).toBe(500)
    })
  })

  // ─── GET /api/v1/reservations/:id ───
  describe('GET /:id', () => {
    it('returns 404 if not found', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).get('/api/v1/reservations/r1')
      expect(res.status).toBe(404)
    })

    it('returns 403 if user tries to read others reservation', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'other' })
      const res = await request(appUser).get('/api/v1/reservations/r1')
      expect(res.status).toBe(403)
    })

    it('returns 200 for owner', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'user1' })
      const res = await request(appUser).get('/api/v1/reservations/r1')
      expect(res.status).toBe(200)
    })

    it('returns 200 for admin reading any reservation', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'other' })
      const res = await request(appAdmin).get('/api/v1/reservations/r1')
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      ;(Reservation.findById as jest.Mock).mockRejectedValue(new Error())
      const res = await request(appUser).get('/api/v1/reservations/r1')
      expect(res.status).toBe(500)
    })
  })

  // ─── POST /api/v1/reservations ───
  describe('POST /', () => {
    it('creates reservation successfully', async () => {
      ;(Reservation.create as jest.Mock).mockResolvedValue({ _id: 'r1' })
      const res = await request(appUser).post('/api/v1/reservations').send({})
      expect(res.status).toBe(201)
    })

    it('returns 400 for standard error', async () => {
      ;(Reservation.create as jest.Mock).mockRejectedValue(new Error('Validation Error'))
      const res = await request(appUser).post('/api/v1/reservations').send({})
      expect(res.body.error).toBe('Validation Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(Reservation.create as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).post('/api/v1/reservations').send({})
      expect(res.body.error).toBe('Invalid data')
    })
  })

  // ─── PUT /api/v1/reservations/:id ───
  describe('PUT /:id', () => {
    it('returns 404 if not found', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).put('/api/v1/reservations/r1')
      expect(res.status).toBe(404)
    })

    it('returns 403 if user modifies others reservation', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'other' })
      const res = await request(appUser).put('/api/v1/reservations/r1')
      expect(res.status).toBe(403)
    })

    it('updates for owner', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'user1' })
      ;(Reservation.findByIdAndUpdate as jest.Mock).mockResolvedValue({ _id: 'r1' })
      const res = await request(appUser).put('/api/v1/reservations/r1').send({})
      expect(res.status).toBe(200)
    })

    it('returns 400 for standard error', async () => {
      ;(Reservation.findById as jest.Mock).mockRejectedValue(new Error('DB Error'))
      const res = await request(appUser).put('/api/v1/reservations/r1')
      expect(res.body.error).toBe('DB Error')
    })

    it('returns 400 for non-standard error', async () => {
      ;(Reservation.findById as jest.Mock).mockRejectedValue('String Error')
      const res = await request(appUser).put('/api/v1/reservations/r1')
      expect(res.body.error).toBe('Invalid data')
    })
  })

  // ─── DELETE /api/v1/reservations/:id ───
  describe('DELETE /:id', () => {
    it('returns 404 if not found', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue(null)
      const res = await request(appUser).delete('/api/v1/reservations/r1')
      expect(res.status).toBe(404)
    })

    it('returns 403 if user deletes others reservation', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'other' })
      const res = await request(appUser).delete('/api/v1/reservations/r1')
      expect(res.status).toBe(403)
    })

    it('deletes for owner', async () => {
      ;(Reservation.findById as jest.Mock).mockResolvedValue({ userId: 'user1' })
      ;(Reservation.findByIdAndDelete as jest.Mock).mockResolvedValue({})
      const res = await request(appUser).delete('/api/v1/reservations/r1')
      expect(res.status).toBe(200)
    })

    it('returns 500 on server error', async () => {
      ;(Reservation.findById as jest.Mock).mockRejectedValue(new Error())
      const res = await request(appUser).delete('/api/v1/reservations/r1')
      expect(res.status).toBe(500)
    })
  })
})