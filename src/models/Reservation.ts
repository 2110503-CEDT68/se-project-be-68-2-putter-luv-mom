import mongoose, { Document, Schema } from 'mongoose'

export interface IReservation extends Document {
  restaurantId: string
  userId: string
  date: Date
  time: string
  partySize: number
  status: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const ReservationSchema = new Schema<IReservation>(
  {
    restaurantId: {
      type: String,
      required: [true, 'Restaurant ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      trim: true,
    },
    partySize: {
      type: Number,
      required: [true, 'Party size is required'],
      min: [1, 'Party size must be at least 1'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

export default mongoose.model<IReservation>('Reservation', ReservationSchema)
