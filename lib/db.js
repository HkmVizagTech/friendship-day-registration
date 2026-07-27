import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._fdMongoose;
if (!cached) cached = global._fdMongoose = { conn: null, promise: null };

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const RegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    age: { type: Number, required: true, min: 5, max: 100 },
    occupation: { type: String, required: true, enum: ['student', 'working'] },

    // working
    company: { type: String, trim: true, default: '' },

    // student
    college: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },

    amount: { type: Number, required: true }, // paise
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
      index: true,
    },

    razorpayOrderId: { type: String, index: true, sparse: true },
    razorpayPaymentId: { type: String, default: '' },
    paymentMethod: { type: String, default: '' },
    paidAt: { type: Date },
    failureReason: { type: String, default: '' },

    ticketCode: { type: String, index: true, sparse: true },
  },
  { timestamps: true }
);

export const Registration =
  mongoose.models.Registration ||
  mongoose.model('Registration', RegistrationSchema);
