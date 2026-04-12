import mongoose, { Document, Schema } from 'mongoose'

export interface IMenu extends Document {
  name: string
  price: number
  category: string
  description?: string
  imageUrl?: string
  venueId: string
  createdAt: Date
  updatedAt: Date
}

const MenuSchema = new Schema<IMenu>(
  {
    name: {
      type: String,
      required: [true, 'Menu name is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be non-negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    venueId: {
      type: String,
      required: [true, 'Venue ID is required'],
    },
  },
  { timestamps: true }
)

export default mongoose.model<IMenu>('Menu', MenuSchema)
