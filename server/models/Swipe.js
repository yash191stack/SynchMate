import mongoose from 'mongoose';

const SwipeSchema = new mongoose.Schema({
  swiper: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  swipee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  direction: {
    type: String,
    enum: ['left', 'right'],
    required: true
  }
}, {
  timestamps: true
});

// Avoid duplicate swipes between same users
SwipeSchema.index({ swiper: 1, swipee: 1 }, { unique: true });

export default mongoose.model('Swipe', SwipeSchema);
