import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, DollarSign, Ban, ShieldCheck, Heart, X } from 'lucide-react';

const SwipeCard = ({ profile, onSwipe, active }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map lateral translation into card rotation & swipe background glow indicator colors
  const rotate = useTransform(x, [-150, 150], [-15, 15]);
  const cardOpacity = useTransform(x, [-150, -100, 0, 100, 150], [0.6, 1, 1, 1, 0.6]);

  const handleDragEnd = (event, info) => {
    const threshold = 130;
    if (info.offset.x > threshold) {
      onSwipe('right', profile._id);
    } else if (info.offset.x < -threshold) {
      onSwipe('left', profile._id);
    }
  };

  const getPreferenceLabel = (val) => {
    if (val <= 0.3) return 'Low';
    if (val <= 0.6) return 'Moderate';
    return 'High';
  };

  return (
    <motion.div
      style={{ x, y, rotate, opacity: cardOpacity, zIndex: active ? 10 : 1 }}
      drag={active}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 1.03, cursor: 'grabbing' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`absolute w-full max-w-sm h-[520px] rounded-2xl border-4 border-black bg-cyber-card shadow-neobrutal p-6 flex flex-col justify-between select-none ${
        active ? 'cursor-grab' : 'pointer-events-none opacity-40 scale-95'
      }`}
    >
      {/* Compatibility Score Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 bg-cyber-purple/20 px-3 py-1 rounded-full border border-cyber-purple/40">
          <Sparkles className="w-4 h-4 text-cyber-purple animate-pulse" />
          <span className="text-sm font-semibold tracking-wide text-cyber-purple">
            Vector Score
          </span>
        </div>
        <div className="bg-cyber-pink text-black font-extrabold px-3 py-1 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-sm">
          {profile.compatibilityScore}% Compatibility
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex-1 flex flex-col justify-start">
        {/* Placeholder Avatar Frame */}
        <div className="w-24 h-24 rounded-full border-4 border-black bg-gradient-to-tr from-cyber-purple via-cyber-pink to-cyber-mint mx-auto mb-4 flex items-center justify-center font-black text-3xl text-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] uppercase">
          {profile.name.charAt(0)}
        </div>

        <h3 className="text-2xl font-bold text-center text-white tracking-wide">
          {profile.name}, {profile.age}
        </h3>
        <p className="text-center text-xs text-cyber-mint font-semibold uppercase tracking-wider mb-3">
          {profile.major} // {profile.college}
        </p>

        <p className="text-sm text-slate-300 text-center italic line-clamp-3 px-2 mb-4">
          "{profile.bio}"
        </p>

        {/* Preference Vectors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-cyber-bg p-2 rounded-lg border-2 border-black text-xs">
            <span className="text-slate-400">Sleep Schedule:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-white">
                {profile.preferences.sleep > 0.6 ? 'Night Owl' : 'Early Bird'}
              </span>
              <span className="text-[10px] text-cyber-purple">{profile.preferences.sleep}</span>
            </div>
          </div>
          <div className="bg-cyber-bg p-2 rounded-lg border-2 border-black text-xs">
            <span className="text-slate-400">Cleanliness:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-white">
                {getPreferenceLabel(profile.preferences.cleanliness)}
              </span>
              <span className="text-[10px] text-cyber-purple">{profile.preferences.cleanliness}</span>
            </div>
          </div>
          <div className="bg-cyber-bg p-2 rounded-lg border-2 border-black text-xs">
            <span className="text-slate-400">Social Battery:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-white">
                {getPreferenceLabel(profile.preferences.socialness)}
              </span>
              <span className="text-[10px] text-cyber-purple">{profile.preferences.socialness}</span>
            </div>
          </div>
          <div className="bg-cyber-bg p-2 rounded-lg border-2 border-black text-xs">
            <span className="text-slate-400">Diet Habit:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-white">
                {profile.preferences.diet > 0.5 ? 'Non-Veg' : 'Veg/Vegan'}
              </span>
              <span className="text-[10px] text-cyber-purple">{profile.preferences.diet}</span>
            </div>
          </div>
        </div>

        {/* Dealbreakers */}
        <div className="border-t-2 border-slate-800/80 pt-3 flex justify-around text-xs">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-cyber-mint" />
            <span className="text-slate-300">
              ₹{profile.dealbreakers.budgetMin}-{profile.dealbreakers.budgetMax}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {profile.dealbreakers.smokingAllowed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-cyber-mint" />
            ) : (
              <Ban className="w-3.5 h-3.5 text-cyber-pink" />
            )}
            <span className="text-slate-300">Smoking</span>
          </div>
          <div className="flex items-center space-x-1">
            {profile.dealbreakers.petsAllowed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-cyber-mint" />
            ) : (
              <Ban className="w-3.5 h-3.5 text-cyber-pink" />
            )}
            <span className="text-slate-300">Pets</span>
          </div>
        </div>
      </div>

      {/* Swipe Overlay Hints */}
      {active && (
        <div className="absolute inset-0 rounded-2xl pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Left Swipe Hint */}
          <motion.div
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            className="absolute inset-0 bg-cyber-pink/20 flex items-center justify-center"
          >
            <div className="border-4 border-cyber-pink text-cyber-pink uppercase font-black tracking-widest text-2xl px-6 py-2 rotate-[-12deg] bg-black/80 rounded-lg">
              Pass
            </div>
          </motion.div>

          {/* Right Swipe Hint */}
          <motion.div
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            className="absolute inset-0 bg-cyber-mint/20 flex items-center justify-center"
          >
            <div className="border-4 border-cyber-mint text-cyber-mint uppercase font-black tracking-widest text-2xl px-6 py-2 rotate-[12deg] bg-black/80 rounded-lg">
              Match
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SwipeCard;
