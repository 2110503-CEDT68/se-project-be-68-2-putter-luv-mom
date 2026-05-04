import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Menu from './models/Menu'
import Restaurant from './models/Restaurant'
import Review from './models/Review'
import PreOrder from './models/PreOrder'

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

const sampleRestaurants = [
  {
    name: 'ครัวคุณแม่',
    description: 'อาหารไทยต้นตำรับ รสชาติแบบบ้านๆ',
    address: '12 ถ.สีลม แขวงสีลม เขตบางรัก กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'บางรัก',
    category: 'อาหารไทย',
    phone: '02-234-5678',
    lat: 13.7248, lng: 100.5274,
  },
  {
    name: 'ต้มยำกุ้งสด',
    description: 'ต้มยำกุ้งรสแซ่บ วัตถุดิบสด',
    address: '45 ถ.สุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'คลองเตย',
    category: 'อาหารไทย',
    phone: '02-345-6789',
    lat: 13.7220, lng: 100.5600,
  },
  {
    name: 'เป็ดพะโล้เยาวราช',
    description: 'เป็ดพะโล้สูตรโบราณ ย่านเยาวราช',
    address: '88 ถ.เยาวราช แขวงสัมพันธวงศ์ เขตสัมพันธวงศ์ กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'สัมพันธวงศ์',
    category: 'อาหารจีน',
    phone: '02-456-7890',
    lat: 13.7395, lng: 100.5100,
  },
  {
    name: 'ติ่มซำฮ่องกง',
    description: 'ติ่มซำสไตล์ฮ่องกง บรรยากาศดี',
    address: '23 ถ.พระราม 3 แขวงช่องนนทรี เขตยานนาวา กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'ยานนาวา',
    category: 'อาหารจีน',
    phone: '02-567-8901',
    lat: 13.7050, lng: 100.5350,
  },
  {
    name: 'ยำตำนาน',
    description: 'ส้มตำ ลาบ ก้อย อีสานแท้',
    address: '5 ถ.รัชดาภิเษก แขวงดินแดง เขตดินแดง กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'ดินแดง',
    category: 'อาหารอีสาน',
    phone: '02-678-9012',
    lat: 13.7650, lng: 100.5640,
  },
  {
    name: 'ข้าวเหนียวหมูย่างอุดร',
    description: 'หมูย่างเนื้อนุ่ม ข้าวเหนียวสด',
    address: '101 ถ.มิตรภาพ ตำบลหมากแข้ง อำเภอเมือง จังหวัดอุดรธานี',
    province: 'อุดรธานี',
    district: 'เมืองอุดรธานี',
    category: 'อาหารอีสาน',
    phone: '042-123-456',
    lat: 17.4138, lng: 102.7876,
  },
  {
    name: 'ข้าวมันไก่สิงคโปร์',
    description: 'ข้าวมันไก่สูตรสิงคโปร์ หนังกรอบ',
    address: '30 ถ.นิมมานเหมินท์ ตำบลสุเทพ อำเภอเมือง จังหวัดเชียงใหม่',
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    category: 'อาหารสิงคโปร์',
    phone: '053-234-567',
    lat: 18.7960, lng: 98.9670,
  },
  {
    name: 'สุกี้ตี๋น้อย',
    description: 'สุกี้น้ำแดงเด็ด วัตถุดิบสดใหม่',
    address: '77 ถ.ท่าแพ ตำบลช้างคลาน อำเภอเมือง จังหวัดเชียงใหม่',
    province: 'เชียงใหม่',
    district: 'เมืองเชียงใหม่',
    category: 'อาหารจีน',
    phone: '053-345-678',
    lat: 18.7880, lng: 98.9990,
  },
  {
    name: 'อาหารทะเลสดภูเก็ต',
    description: 'ซีฟู้ดสด จากทะเลอันดามัน',
    address: '15 ถ.ราษฎร์อุทิศ ตำบลวิชิต อำเภอเมือง จังหวัดภูเก็ต',
    province: 'ภูเก็ต',
    district: 'เมืองภูเก็ต',
    category: 'ซีฟู้ด',
    phone: '076-123-456',
    lat: 7.8800, lng: 98.3920,
  },
  {
    name: 'แกงไตปลาเมืองใต้',
    description: 'แกงไตปลารสเข้มข้น ต้นตำรับภาคใต้',
    address: '9 ถ.เพชรเกษม ตำบลบ่อยาง อำเภอเมือง จังหวัดสงขลา',
    province: 'สงขลา',
    district: 'เมืองสงขลา',
    category: 'อาหารใต้',
    phone: '074-234-567',
    lat: 7.2045, lng: 100.5968,
  },
  {
    name: 'พิซซ่าเตาฟืน',
    description: 'พิซซ่าเตาฟืน สไตล์อิตาเลียน',
    address: '55 ถ.สาทรใต้ แขวงยานนาวา เขตสาทร กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'สาทร',
    category: 'อาหารตะวันตก',
    phone: '02-789-0123',
    lat: 13.7200, lng: 100.5250,
  },
  {
    name: 'สเต็กเฮ้าส์พระราม 9',
    description: 'สเต็กเนื้อออสเตรเลีย ย่างถ่าน',
    address: '200 ถ.พระราม 9 แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'ห้วยขวาง',
    category: 'อาหารตะวันตก',
    phone: '02-890-1234',
    lat: 13.7580, lng: 100.5690,
  },
  {
    name: 'ราเมนฮอกไกโด',
    description: 'ราเมนน้ำซุปกระดูกหมู ต้นตำรับญี่ปุ่น',
    address: '18 ถ.ทองหล่อ แขวงคลองตันเหนือ เขตวัฒนา กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    category: 'อาหารญี่ปุ่น',
    phone: '02-901-2345',
    lat: 13.7310, lng: 100.5850,
  },
  {
    name: 'ซูชิโอซาก้า',
    description: 'ซูชิและซาซิมิสดใหม่ทุกวัน',
    address: '62 ถ.อโศก แขวงคลองเตยเหนือ เขตวัฒนา กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'วัฒนา',
    category: 'อาหารญี่ปุ่น',
    phone: '02-012-3456',
    lat: 13.7370, lng: 100.5620,
  },
  {
    name: 'ก๋วยเตี๋ยวเรือบางกอก',
    description: 'ก๋วยเตี๋ยวเรือสูตรโบราณ น้ำซุปเข้มข้น',
    address: '3 ซ.อยุธยา แขวงถนนพญาไท เขตราชเทวี กรุงเทพมหานคร',
    province: 'กรุงเทพมหานคร',
    district: 'ราชเทวี',
    category: 'อาหารไทย',
    phone: '02-123-4567',
    lat: 13.7540, lng: 100.5380,
  },
]

async function seed() {
  const uri = process.env.MONGO_URI
  if (!uri) { console.error('MONGO_URI not set'); process.exit(1) }

  await mongoose.connect(uri)
  console.log('Connected to MongoDB')

  // Seed menus
  await Menu.deleteMany({ venueId: VENUE_ID })
  const insertedMenus = await Menu.insertMany(menuItems)
  console.log(`Inserted ${insertedMenus.length} menu items`)

  // Seed restaurants
  await Restaurant.deleteMany({})
  const insertedRestaurants = await Restaurant.insertMany(sampleRestaurants)
  console.log(`Inserted ${insertedRestaurants.length} restaurants:`)
  insertedRestaurants.forEach(r => console.log(`  - [${r.category}] ${r.name} (${r.district}, ${r.province})`))

  // Seed reviews — 3-6 per restaurant, ratings 3-5 with one realistic comment each.
  // Without reviews, restaurants display as 0★ / 0 reviews and US3-4 sort-by-rating
  // is a no-op. This gives the demo meaningful aggregates.
  await Review.deleteMany({})
  const sampleComments = [
    'รสชาติดีมาก คุ้มราคา',
    'อร่อย บรรยากาศดี',
    'จะกลับมาอีกแน่นอน',
    'พนักงานบริการดี',
    'พอใช้ได้ ราคาไม่แรง',
    'อร่อยและสะอาด',
  ]
  const reviewSeeds: Array<{ restaurantId: string; userId: string; rating: number; comment: string }> = []
  insertedRestaurants.forEach((r, idx) => {
    const count = 3 + (idx % 4) // 3..6
    for (let i = 0; i < count; i++) {
      const rating = 3 + ((idx + i) % 3) // 3..5 distributed
      reviewSeeds.push({
        restaurantId: String(r._id),
        userId: `seed-user-${(idx * 7 + i) % 9}`,
        rating,
        comment: sampleComments[(idx + i) % sampleComments.length],
      })
    }
  })
  await Review.insertMany(reviewSeeds)
  console.log(`Inserted ${reviewSeeds.length} reviews across ${insertedRestaurants.length} restaurants`)

  // Drop legacy preorders. Old docs were keyed only by venueId (no userId), which
  // means every user shared the same cart per restaurant. The new model requires
  // userId; legacy rows can't be saved. Wiping is safe — preorders are transient.
  const dropped = await PreOrder.deleteMany({})
  await PreOrder.collection.dropIndexes().catch(() => {}) // remove old unique index
  console.log(`Dropped ${dropped.deletedCount ?? 0} legacy preorders`)

  await mongoose.disconnect()
  console.log('Done.')
}

seed().catch(err => { console.error(err); process.exit(1) })
