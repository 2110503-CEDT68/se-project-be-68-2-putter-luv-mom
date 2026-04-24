import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Menu from './models/Menu'

dotenv.config()

const VENUE_ID = 'restaurant-01'

const menuItems = [
  { name: 'Spring Rolls',       price: 120, category: 'Appetizer',   venueId: VENUE_ID },
  { name: 'Pad Thai',           price: 180, category: 'Main Course', venueId: VENUE_ID },
  { name: 'Mango Sticky Rice',  price: 95,  category: 'Dessert',     venueId: VENUE_ID },
  { name: 'Tom Yum Goong',      price: 220, category: 'Main Course', venueId: VENUE_ID },
  { name: 'Thai Iced Tea',      price: 60,  category: 'Beverage',    venueId: VENUE_ID },
  { name: 'Som Tum',            price: 110, category: 'Appetizer',   venueId: VENUE_ID },
  { name: 'Sticky Rice',        price: 40,  category: 'Side',        venueId: VENUE_ID },
]

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1) }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  await Menu.deleteMany({ venueId: VENUE_ID })
  console.log('Cleared existing menus for venue:', VENUE_ID)

  const inserted = await Menu.insertMany(menuItems)
  console.log(`Inserted ${inserted.length} menu items:`)
  inserted.forEach(m => console.log(`  - [${m.category}] ${m.name} ฿${m.price}`))

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
