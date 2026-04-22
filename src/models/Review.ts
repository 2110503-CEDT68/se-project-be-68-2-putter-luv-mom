import mongoose, { Document, Schema } from 'mongoose'

export interface IReview extends Document {
  restaurantId: string
  userId: string
  rating: number
  comment?: string
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    restaurantId: {
      type: String,
      required: [true, 'Restaurant ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5'],
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model<IReview>('Review', ReviewSchema)
