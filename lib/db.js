import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._fdMongoose;
if (!cached) cached = global._fdMongoose = { conn: null, promise: null };

export async function connectDB() {
  if (!MONGODB_URI) throw new Error('MONGODB_URI is not set');
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false, maxPoolSize: 5 });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const PREACHER_VALUES = [
  'Kesava Kripa Dasa (MVP)',
  'Gopeswara Dasa (Kommadi)',
  'Ranveer Rama Dasa (AU)',
  'Shadgoswami Dasa (Anits)',
  'Mukunda Gauranga Dasa (Rushikonda)',
];

// One registration = one attendee. No single/duo, no friend sub-document.
const RegistrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    age: { type: Number, required: true, min: 5, max: 30 },
    occupation: { type: String, required: true, enum: ['student', 'working'] },
    company: { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: '' },
    year: { type: String, trim: true, default: '' },
    preacher: { type: String, required: true, enum: PREACHER_VALUES, index: true },

    // Free event: a registration is complete the moment it's saved, so
    // there is only one status. Kept as a field so gate/admin code that
    // already checks `status` needs no structural change.
    status: { type: String, enum: ['registered'], default: 'registered', index: true },

    ticketCode: { type: String, index: true, sparse: true },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

export const Registration =
  mongoose.models.Registration || mongoose.model('Registration', RegistrationSchema);
