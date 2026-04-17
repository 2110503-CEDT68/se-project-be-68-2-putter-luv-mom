import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db'
import menuRoutes from './routes/menu'
import preorderRoutes from './routes/preorder'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Routes
app.use('/api/v1/menus', menuRoutes)
app.use('/api/v1/preorders', preorderRoutes)

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ success: true, message: 'Menu API is running' })
})

const PORT = process.env.PORT || 5000

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
})

export default app
