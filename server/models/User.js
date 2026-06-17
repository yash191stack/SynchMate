import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  major: {
    type: String,
    trim: true,
    default: ''
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Non-Binary', 'Other', ''],
    default: ''
  },
  age: {
    type: Number,
    min: 16
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  isProfileComplete: {
    type: Boolean,
    default: false
  },
  // Numerical preference vectors for Cosine Similarity matching (scaled 0.1 - 0.9)
  preferences: {
    sleep: { type: Number, min: 0.1, max: 0.9 },
    cleanliness: { type: Number, min: 0.1, max: 0.9 },
    socialness: { type: Number, min: 0.1, max: 0.9 },
    diet: { type: Number, min: 0.1, max: 0.9 }
  },
  // Hard-lock filters that instantly disqualify a match if there is a conflict
  dealbreakers: {
    budgetMin: { type: Number },
    budgetMax: { type: Number },
    smokingAllowed: { type: Boolean, default: false },
    petsAllowed: { type: Boolean, default: false }
  },
  // GeoJSON location index for geospatial campus radius searches
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number] // [longitude, latitude]
    }
  }
}, {
  timestamps: true
});

// Enable geospatial queries on the location field
UserSchema.index({ location: '2dsphere' });

export default mongoose.model('User', UserSchema);
