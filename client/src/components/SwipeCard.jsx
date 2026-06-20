import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, DollarSign, Ban, ShieldCheck, Heart, X, Moon, Sun, Shield } from 'lucide-react';

const SwipeCard = ({ profile, onSwipe, active }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Map lateral translation into card rotation & swipe opacity shifts
  const rotate = useTransform(x, [-150, 150], [-12, 12]);
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
      whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className={`absolute w-full max-w-sm h-[540px] rounded-[2.5rem] border border-white/80 bg-white/90 backdrop-blur-2xl shadow-xl p-6 flex flex-col justify-between select-none ${
        active ? 'cursor-grab shadow-indigo-500/5' : 'pointer-events-none opacity-40 scale-[0.96] translate-y-3'
      }`}
    >
      {/* Compatibility Score Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">
          <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="text-xs font-bold text-indigo-700">
            Vector Match
          </span>
        </div>
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white font-extrabold px-3 py-1.5 rounded-2xl shadow-md text-xs tracking-wide">
          {profile.compatibilityScore}% Match
        </div>
      </div>

      {/* Profile Details */}
      <div className="flex-1 flex flex-col justify-start">
        {/* Profile Avatar with soft gradient glow */}
        <div className="relative w-24 h-24 mx-auto mb-4">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-cyan-400 rounded-full blur-md opacity-25"></div>
          <div className="relative w-24 h-24 rounded-full border-2 border-white bg-gradient-to-tr from-indigo-100 to-cyan-50 flex items-center justify-center font-bold text-3xl text-indigo-600 shadow-md uppercase">
            {profile.name.charAt(0)}
          </div>
        </div>

        <h3 className="text-2xl font-black text-center text-slate-900 tracking-tight">
          {profile.name}, {profile.age}
        </h3>
        <p className="text-center text-xs text-indigo-600 font-extrabold uppercase tracking-widest mb-3">
          {profile.major} // {profile.college}
        </p>

        <p className="text-xs text-slate-500 text-center italic line-clamp-3 px-4 mb-4">
          "{profile.bio || "No bio provided."}"
        </p>

        {/* Preference Vectors Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-xs">
            <span className="text-slate-400 font-semibold">Sleep Schedule:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800">
                {profile.preferences.sleep > 0.6 ? 'Night Owl' : profile.preferences.sleep <= 0.3 ? 'Early Bird' : 'Balanced'}
              </span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-md font-bold text-slate-600">{profile.preferences.sleep}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-xs">
            <span className="text-slate-400 font-semibold">Cleanliness:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800">
                {getPreferenceLabel(profile.preferences.cleanliness)}
              </span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-md font-bold text-slate-600">{profile.preferences.cleanliness}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-xs">
            <span className="text-slate-400 font-semibold">Social Battery:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800">
                {getPreferenceLabel(profile.preferences.socialness)}
              </span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-md font-bold text-slate-600">{profile.preferences.socialness}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-2xl text-xs">
            <span className="text-slate-400 font-semibold">Diet Habit:</span>
            <div className="flex justify-between items-center mt-1">
              <span className="font-bold text-slate-800">
                {profile.preferences.diet > 0.5 ? 'Non-Veg' : 'Veg/Vegan'}
              </span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-md font-bold text-slate-600">{profile.preferences.diet}</span>
            </div>
          </div>
        </div>

        {/* Dealbreakers Bar */}
        <div className="border-t border-slate-100 pt-3 flex justify-around text-xs">
          <div className="flex items-center space-x-1">
            <DollarSign className="w-3.5 h-3.5 text-cyan-600" />
            <span className="text-slate-600 font-medium">
              ₹{profile.dealbreakers.budgetMin}-{profile.dealbreakers.budgetMax}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {profile.dealbreakers.smokingAllowed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Ban className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="text-slate-600 font-medium">Smoking</span>
          </div>
          <div className="flex items-center space-x-1">
            {profile.dealbreakers.petsAllowed ? (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            ) : (
              <Ban className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="text-slate-600 font-medium">Pets</span>
          </div>
        </div>
      </div>

      {/* Swipe Overlay Hints (Match/Pass visual labels) */}
      {active && (
        <div className="absolute inset-0 rounded-[2.5rem] pointer-events-none flex items-center justify-center overflow-hidden">
          {/* Left Swipe Hint */}
          <motion.div
            style={{ opacity: useTransform(x, [-100, 0], [1, 0]) }}
            className="absolute inset-0 bg-rose-500/10 flex items-center justify-center"
          >
            <div className="border-2 border-rose-500 text-rose-500 uppercase font-black tracking-widest text-xl px-5 py-1.5 rotate-[-12deg] bg-white rounded-xl shadow-lg">
              Pass
            </div>
          </motion.div>

          {/* Right Swipe Hint */}
          <motion.div
            style={{ opacity: useTransform(x, [0, 100], [0, 1]) }}
            className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center"
          >
            <div className="border-2 border-emerald-500 text-emerald-500 uppercase font-black tracking-widest text-xl px-5 py-1.5 rotate-[12deg] bg-white rounded-xl shadow-lg">
              Connect
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default SwipeCard;
