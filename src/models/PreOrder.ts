import mongoose, { Document, Schema } from 'mongoose'

export interface IPreOrderItem {
  menuId: string
  name: string
  price: number
  quantity: number
}

export interface IPreOrder extends Document {
  userId: string
  venueId: string
  items: IPreOrderItem[]
  total: number
  createdAt: Date
  updatedAt: Date
}

const PreOrderItemSchema = new Schema<IPreOrderItem>(
  {
    menuId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
)

const PreOrderSchema = new Schema<IPreOrder>(
  {
    userId: { type: String, required: true, index: true },
    venueId: { type: String, required: true },
    items: { type: [PreOrderItemSchema], default: [] },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
)

PreOrderSchema.index({ userId: 1, venueId: 1 }, { unique: true })

PreOrderSchema.pre('save', function (next) {
  this.total = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  next()
})

export default mongoose.model<IPreOrder>('PreOrder', PreOrderSchema)
