import mongoose, { Document, Schema } from 'mongoose'

export interface IRestaurant extends Document {
  name: string
  description?: string
  address: string
  phone?: string
  imageUrl?: string
  category?: string
  createdAt: Date
  updatedAt: Date
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    category: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model<IRestaurant>('Restaurant', RestaurantSchema)
