import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'
import menuRoutes from './routes/menu'
import preorderRoutes from './routes/preorder'
import authRoutes from './routes/auth'
import restaurantRoutes from './routes/restaurant'
import reservationRoutes from './routes/reservation'
import reviewRoutes from './routes/review'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/v1/menus', menuRoutes)
app.use('/api/v1/preorders', preorderRoutes)
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/restaurants', restaurantRoutes)
app.use('/api/v1/reservations', reservationRoutes)
app.use('/api/v1/reviews', reviewRoutes)

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Menu API is running' })
})

// Connect DB then start server only in local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5003
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
} else {
  connectDB()
}

export default app
