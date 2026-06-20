import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import SwipeCard from './components/SwipeCard';
import { 
  Sparkles, Heart, X, MessageSquare, 
  MapPin, CheckCircle, Send, User, Compass,
  ChevronRight, ArrowLeft, LogOut, Lock, Mail, 
  DollarSign, Activity, Eye, ShieldCheck, ArrowRight
} from 'lucide-react';

const API_BASE = 'http://localhost:5001/api';

// Fallback mock data in case backend is offline
const SANDBOX_MATCHES = [
  {
    _id: "65e21970b5c1fb3a7582b101",
    name: "Aditya Sharma",
    age: 21,
    college: "GLA University",
    major: "Computer Science",
    bio: "Looking for someone quiet who doesn't mind late night coding sessions. Cleanliness is a huge deal for me. Let's make something epic!",
    gender: "Male",
    preferences: { sleep: 0.8, cleanliness: 0.9, socialness: 0.4, diet: 0.6 },
    dealbreakers: { budgetMin: 1200, budgetMax: 2000, smokingAllowed: false, petsAllowed: false },
    compatibilityScore: 94
  },
  {
    _id: "65e21970b5c1fb3a7582b102",
    name: "Ananya Iyer",
    age: 20,
    college: "GLA University",
    major: "Design & UX",
    bio: "Neubrutalism and retro-cyber aesthetics. I love cooking and having friends over on weekends. Pet lover!",
    gender: "Female",
    preferences: { sleep: 0.5, cleanliness: 0.7, socialness: 0.8, diet: 0.9 },
    dealbreakers: { budgetMin: 1500, budgetMax: 2500, smokingAllowed: false, petsAllowed: true },
    compatibilityScore: 88
  }
];

function App() {
  // Authentication & Flow State
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [currentStep, setCurrentStep] = useState(1); // Onboarding Steps (1-4)
  const [authError, setAuthError] = useState('');
  const [appScreen, setAppScreen] = useState('landing'); // 'landing' | 'auth' | 'onboard' | 'dashboard'

  // Input states for Auth
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
    college: 'GLA University'
  });

  // Onboarding Preference states
  const [onboardForm, setOnboardForm] = useState({
    major: '',
    gender: 'Male',
    age: 20,
    bio: '',
    preferences: { sleep: 0.5, cleanliness: 0.5, socialness: 0.5, diet: 0.5 },
    dealbreakers: { budgetMin: 1000, budgetMax: 2000, smokingAllowed: false, petsAllowed: false },
    coordinates: [77.5946, 12.9716] // Default coordinates [long, lat]
  });

  // Dashboard Core States
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [typedMessage, setTypedMessage] = useState('');
  const [newMatchModal, setNewMatchModal] = useState(null);

  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Auto-redirect or authenticate on startup
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUserProfile();
    } else {
      setAppScreen('landing');
    }
  }, [token]);

  // Hook WebSocket triggers once profile is complete
  useEffect(() => {
    if (user && user.isProfileComplete && appScreen === 'dashboard') {
      socketRef.current = io('http://localhost:5001');

      socketRef.current.on('connect', () => {
        socketRef.current.emit('identify', user._id);
      });

      socketRef.current.on('match_created', (data) => {
        const matchedUser = deck.find(c => c._id === data.matchedUser) || 
                            SANDBOX_MATCHES.find(c => c._id === data.matchedUser);
        if (matchedUser) {
          setNewMatchModal(matchedUser);
          setMatches(prev => [...prev, matchedUser]);
        }
      });

      socketRef.current.on('receive_message', (message) => {
        const chatPartnerId = message.senderId === user._id ? message.recipientId : message.senderId;
        setChatMessages(prev => ({
          ...prev,
          [chatPartnerId]: [...(prev[chatPartnerId] || []), message]
        }));
      });

      fetchDiscoverDeck();
      fetchMatches();

      return () => {
        if (socketRef.current) socketRef.current.disconnect();
      };
    }
  }, [user, appScreen]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChat]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/auth/me`);
      setUser(response.data);
      if (response.data.isProfileComplete) {
        setAppScreen('dashboard');
      } else {
        setAppScreen('onboard');
      }
    } catch (err) {
      handleLogout();
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, authForm);
      const { token: receivedToken, user: registeredUser } = response.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(registeredUser);
      setAppScreen('onboard');
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Registration failed. Check your email address.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: authForm.email,
        password: authForm.password
      });
      const { token: receivedToken, user: loggedUser } = response.data;
      localStorage.setItem('token', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      if (loggedUser.isProfileComplete) {
        setAppScreen('dashboard');
      } else {
        setAppScreen('onboard');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Invalid credentials.');
    }
  };

  const handleOnboardingSubmit = async () => {
    try {
      const response = await axios.post(`${API_BASE}/auth/onboard`, onboardForm);
      setUser(response.data.user);
      setAppScreen('dashboard');
    } catch (err) {
      console.error('Onboarding update failed. Switched to dashboard.', err);
      // Fallback sandbox mock completion
      setUser(prev => ({ ...prev, isProfileComplete: true }));
      setAppScreen('dashboard');
    }
  };

  const fetchDiscoverDeck = async () => {
    try {
      const response = await axios.get(`${API_BASE}/matching/discover`);
      setDeck(response.data);
      setCurrentIndex(0);
    } catch (err) {
      console.warn('Backend server matching endpoints offline. Loading local matches.');
      setDeck(SANDBOX_MATCHES);
      setCurrentIndex(0);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API_BASE}/matching/matches`);
      setMatches(response.data);
    } catch (err) {
      console.warn('Matches API offline. Loading local matches.');
      setMatches(SANDBOX_MATCHES);
    }
  };

  const handleSwipeAction = async (direction, candidateId) => {
    try {
      const response = await axios.post(`${API_BASE}/matching/swipe`, {
        candidateId,
        direction
      });

      if (response.data && response.data.matchCreated) {
        const matchedProfile = deck.find(c => c._id === candidateId);
        if (matchedProfile) {
          setNewMatchModal(matchedProfile);
          setMatches(prev => [...prev, matchedProfile]);
        }
      }
    } catch (error) {
      console.warn('Swipe cache offline. Sandbox simulation activated.');
      if (direction === 'right' && candidateId === "65e21970b5c1fb3a7582b101") {
        setTimeout(() => {
          const matchedProfile = deck.find(c => c._id === candidateId);
          if (matchedProfile) {
            setNewMatchModal(matchedProfile);
            setMatches(prev => [...prev, matchedProfile]);
          }
        }, 800);
      }
    }
    setCurrentIndex(prev => prev + 1);
  };

  const handleSelectChat = async (match) => {
    setActiveChat(match);
    try {
      const response = await axios.get(`${API_BASE}/matching/chat/${match._id}`);
      setChatMessages(prev => ({ ...prev, [match._id]: response.data }));
    } catch (err) {
      console.warn('Persistent message API offline. Loading active session chats.');
    }
  };

  const handleSendChatMessage = () => {
    if (!typedMessage.trim() || !activeChat) return;

    const newMessage = {
      senderId: user._id,
      recipientId: activeChat._id,
      text: typedMessage.trim(),
      timestamp: new Date()
    };

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', newMessage);
    } else {
      setChatMessages(prev => ({
        ...prev,
        [activeChat._id]: [...(prev[activeChat._id] || []), newMessage]
      }));

      // Simulate reply
      setTimeout(() => {
        const reply = {
          senderId: activeChat._id,
          recipientId: user._id,
          text: `Hey! Love our SynchMate alignment score. Let's arrange a call to discuss the flat options!`,
          timestamp: new Date()
        };
        setChatMessages(prev => ({
          ...prev,
          [activeChat._id]: [...(prev[activeChat._id] || []), reply]
        }));
      }, 1500);
    }

    setTypedMessage('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAppScreen('landing');
  };

  const handlePreferenceSlider = (key, value) => {
    setOnboardForm(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: parseFloat(value)
      }
    }));
  };

  const handleDealbreakerToggle = (key) => {
    setOnboardForm(prev => ({
      ...prev,
      dealbreakers: {
        ...prev.dealbreakers,
        [key]: !prev.dealbreakers[key]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans relative overflow-x-hidden">
      {/* Holomorphic soft glow blurs */}
      <div className="absolute top-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-300/20 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-300/20 blur-[150px] pointer-events-none"></div>

      {/* RENDER SCREEN 1: LANDING PAGE */}
      {appScreen === 'landing' && (
        <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen flex flex-col justify-between relative z-10">
          <header className="flex justify-between items-center">
            <div className="flex items-center space-x-2.5">
              <Compass className="w-8 h-8 text-indigo-600" />
              <span className="text-2xl font-black tracking-tight uppercase text-slate-900">
                Synch<span className="text-cyan-600">Mate</span>
              </span>
            </div>
            <button 
              onClick={() => { setAuthTab('login'); setAppScreen('auth'); }}
              className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-700 font-bold shadow-sm hover:shadow-md transition-all text-sm"
            >
              Sign In
            </button>
          </header>

          <main className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center my-auto py-12">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1.5 text-indigo-700 text-xs font-semibold">
                <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                <span>Next-Gen Roommate Matching Engine</span>
              </div>
              <h2 className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
                Find the perfect roomies by <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Vector Math</span>
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed max-w-lg">
                Stop relying on chaotic Facebook groups or random WhatsApp forms. Map your sleeping habits, cleanliness vectors, and hard-lock budget dealbreakers to discover verified peer matches near campus.
              </p>
              <div className="flex space-x-4 pt-4">
                <button 
                  onClick={() => { setAuthTab('register'); setAppScreen('auth'); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-full shadow-lg hover:shadow-indigo-500/20 flex items-center space-x-2 transition-all"
                >
                  <span>Register Free</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => { setAuthTab('login'); setAppScreen('auth'); }}
                  className="bg-white border border-slate-200 text-slate-800 font-bold px-8 py-4 rounded-full shadow-sm hover:shadow-md transition-all"
                >
                  Secure Log In
                </button>
              </div>
            </div>

            {/* Premium Mock Illustration */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-[40px] border border-white/80 bg-white/70 backdrop-blur-md p-8 shadow-2xl relative">
                <div className="absolute top-4 right-4 bg-indigo-600 text-white font-extrabold text-xs px-3 py-1 rounded-full">
                  98% Alignment
                </div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 mx-auto mb-6 flex items-center justify-center font-bold text-2xl text-white shadow-md">
                  S
                </div>
                <h4 className="text-center text-xl font-bold text-slate-900">Siddharth, 20</h4>
                <p className="text-center text-xs text-indigo-600 font-semibold mb-4 uppercase tracking-wider">GLA University // BTech</p>
                <div className="space-y-3 mt-6">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 flex justify-between text-xs">
                    <span className="text-slate-500">Cleanliness:</span>
                    <span className="font-bold text-slate-800">Ultra-High</span>
                  </div>
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/50 flex justify-between text-xs">
                    <span className="text-slate-500">Social Battery:</span>
                    <span className="font-bold text-slate-800">Moderate</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <footer className="text-center text-slate-400 text-xs border-t border-slate-100 pt-6">
            &copy; {new Date().getFullYear()} SynchMate Technology Labs Inc. Privacy First, College Domain Verified.
          </footer>
        </div>
      )}

      {/* RENDER SCREEN 2: AUTHENTICATION */}
      {appScreen === 'auth' && (
        <div className="max-w-md w-full mx-auto px-6 min-h-screen flex flex-col justify-center relative z-10">
          <button 
            onClick={() => setAppScreen('landing')}
            className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-800 mb-6 text-sm font-semibold self-start"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <div className="bg-white/80 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl flex flex-col">
            <div className="flex items-center justify-center space-x-2 mb-8">
              <Compass className="w-7 h-7 text-indigo-600" />
              <span className="text-xl font-extrabold uppercase text-slate-950">
                Synch<span className="text-cyan-600">Mate</span>
              </span>
            </div>

            {/* Toggle Tabs */}
            <div className="flex border-b border-slate-100 mb-6">
              <button 
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                  authTab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                }`}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setAuthTab('register'); setAuthError(''); }}
                className={`flex-1 pb-3 text-center text-sm font-bold border-b-2 transition-all ${
                  authTab === 'register' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3 rounded-xl mb-4 font-medium">
                {authError}
              </div>
            )}

            {authTab === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="email"
                      required
                      placeholder="username@example.com"
                      value={authForm.email}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input 
                      type="password"
                      required
                      placeholder="••••••••"
                      value={authForm.password}
                      onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all text-sm uppercase mt-6"
                >
                  Verify credentials
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Full Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={authForm.name}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">College</label>
                  <input 
                    type="text"
                    required
                    placeholder="GLA University"
                    value={authForm.college}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, college: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={authForm.email}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                  <span className="text-[10px] text-indigo-500 mt-1 block">Enter your personal or collegiate email address.</span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-500 font-bold mb-1.5">Choose Password</label>
                  <input 
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={authForm.password}
                    onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all text-sm uppercase mt-6"
                >
                  Create verified account
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* RENDER SCREEN 3: ONBOARDING WIZARD */}
      {appScreen === 'onboard' && (
        <div className="max-w-xl w-full mx-auto px-6 min-h-screen flex flex-col justify-center py-12 relative z-10">
          <div className="bg-white/80 backdrop-blur-md border border-white/60 p-8 rounded-3xl shadow-xl flex flex-col">
            {/* Step Progress */}
            <div className="flex justify-between items-center mb-8">
              <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                Step {currentStep} of 4: {
                  currentStep === 1 ? 'Academic Base' :
                  currentStep === 2 ? 'Lifestyle Habits' :
                  currentStep === 3 ? 'Lifestyle Hard-Locks' : 'Local coordinates'
                }
              </span>
              <div className="flex space-x-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div 
                    key={s} 
                    className={`w-8 h-2 rounded-full transition-all duration-300 ${
                      s <= currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* STEP 1: Academic Profile */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">Tell us about your college profile</h3>
                <p className="text-slate-500 text-sm mb-6">These help prospective roommates know who they're matching with.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Age</label>
                    <input 
                      type="number"
                      value={onboardForm.age}
                      onChange={(e) => setOnboardForm(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Gender</label>
                    <select
                      value={onboardForm.gender}
                      onChange={(e) => setOnboardForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-Binary">Non-Binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Academic Major</label>
                  <input 
                    type="text"
                    required
                    placeholder="Computer Science, Psychology, etc."
                    value={onboardForm.major}
                    onChange={(e) => setOnboardForm(prev => ({ ...prev, major: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Short Bio</label>
                  <textarea 
                    rows={3}
                    placeholder="Tell roomies a bit about yourself..."
                    value={onboardForm.bio}
                    onChange={(e) => setOnboardForm(prev => ({ ...prev, bio: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <button
                  disabled={!onboardForm.major}
                  onClick={() => setCurrentStep(2)}
                  className="w-full bg-indigo-600 disabled:bg-slate-300 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center space-x-2 uppercase mt-6"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Lifestyle Preferences */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Numerical Preference Vectors</h3>
                <p className="text-slate-500 text-sm">These parameters are fed into the Cosine Similarity matching calculation.</p>
                
                {/* Sleep Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Sleep Habit</span>
                    <span className="text-indigo-600">
                      {onboardForm.preferences.sleep <= 0.3 ? 'Early Bird' : onboardForm.preferences.sleep <= 0.6 ? 'Balanced' : 'Night Owl'} ({onboardForm.preferences.sleep})
                    </span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.9" step="0.1"
                    value={onboardForm.preferences.sleep}
                    onChange={(e) => handlePreferenceSlider('sleep', e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Cleanliness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Cleanliness Level</span>
                    <span className="text-indigo-600">
                      {onboardForm.preferences.cleanliness <= 0.3 ? 'Relaxed' : onboardForm.preferences.cleanliness <= 0.6 ? 'Moderate' : 'Immaculate'} ({onboardForm.preferences.cleanliness})
                    </span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.9" step="0.1"
                    value={onboardForm.preferences.cleanliness}
                    onChange={(e) => handlePreferenceSlider('cleanliness', e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Socialness Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Social Battery</span>
                    <span className="text-indigo-600">
                      {onboardForm.preferences.socialness <= 0.3 ? 'Quiet' : onboardForm.preferences.socialness <= 0.6 ? 'Friendly' : 'Lively / Guests often'} ({onboardForm.preferences.socialness})
                    </span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.9" step="0.1"
                    value={onboardForm.preferences.socialness}
                    onChange={(e) => handlePreferenceSlider('socialness', e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Diet Slider */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Diet Habits</span>
                    <span className="text-indigo-600">
                      {onboardForm.preferences.diet <= 0.5 ? 'Veg/Vegan' : 'Non-Veg'} ({onboardForm.preferences.diet})
                    </span>
                  </div>
                  <input 
                    type="range" min="0.1" max="0.9" step="0.1"
                    value={onboardForm.preferences.diet}
                    onChange={(e) => handlePreferenceSlider('diet', e.target.value)}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl uppercase text-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center space-x-2 uppercase text-sm"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Lifestyle Hard-Locks */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Lifestyle Hard-Locks</h3>
                <p className="text-slate-500 text-sm">If these parameters don't align with someone, the compatibility score is instantly forced to 0%.</p>

                {/* Budget Min/Max */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Monthly Budget Range (₹)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm">₹</span>
                      <input 
                        type="number"
                        placeholder="Min"
                        value={onboardForm.dealbreakers.budgetMin}
                        onChange={(e) => setOnboardForm(prev => ({
                          ...prev,
                          dealbreakers: { ...prev.dealbreakers, budgetMin: parseInt(e.target.value) }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl text-sm"
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-400 text-sm">₹</span>
                      <input 
                        type="number"
                        placeholder="Max"
                        value={onboardForm.dealbreakers.budgetMax}
                        onChange={(e) => setOnboardForm(prev => ({
                          ...prev,
                          dealbreakers: { ...prev.dealbreakers, budgetMax: parseInt(e.target.value) }
                        }))}
                        className="w-full bg-slate-50 border border-slate-200 p-3 pl-8 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Smoking Toggle */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Smoking Allowed</h4>
                    <p className="text-[11px] text-slate-400">Allows smoking inside the apartment.</p>
                  </div>
                  <button 
                    onClick={() => handleDealbreakerToggle('smokingAllowed')}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-350 ${
                      onboardForm.dealbreakers.smokingAllowed ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                    } flex items-center`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                {/* Pets Toggle */}
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">Pets Friendly</h4>
                    <p className="text-[11px] text-slate-400">Allows keeping pets inside the apartment.</p>
                  </div>
                  <button 
                    onClick={() => handleDealbreakerToggle('petsAllowed')}
                    className={`w-12 h-6 rounded-full p-1 transition-all duration-350 ${
                      onboardForm.dealbreakers.petsAllowed ? 'bg-indigo-600 justify-end' : 'bg-slate-200 justify-start'
                    } flex items-center`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl uppercase text-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setCurrentStep(4)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center space-x-2 uppercase text-sm"
                  >
                    <span>Continue</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Campus Coordinates */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-slate-900">Geospatial Campus Radius</h3>
                <p className="text-slate-500 text-sm">We use MongoDB geospatial `$geoNear` aggregation index to locate matches within your campus area.</p>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-full">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-950">Campus Anchor Coordinates</h4>
                    <p className="text-xs text-slate-400">Current: Longitude: {onboardForm.coordinates[0]}, Latitude: {onboardForm.coordinates[1]}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-400">For testing, coordinates are locked to your university campus area center. In production, this pulls dynamically from your geolocation API.</p>

                <div className="flex space-x-3 pt-4">
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl uppercase text-sm"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleOnboardingSubmit}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center space-x-2 uppercase text-sm"
                  >
                    <span>Complete Onboarding</span>
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER SCREEN 4: DASHBOARD (Phase 4 Holomorphic Dashboard) */}
      {appScreen === 'dashboard' && user && (
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6 z-10 relative">
          {/* Main header block */}
          <header className="flex justify-between items-center mb-6 bg-white/75 backdrop-blur-md p-4 rounded-3xl border border-white/50 shadow-sm">
            <div className="flex items-center space-x-2">
              <Compass className="w-7 h-7 text-indigo-600 animate-spin-slow" />
              <span className="text-xl font-black uppercase text-slate-900 tracking-tight">
                Synch<span className="text-cyan-600">Mate</span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded-full">
                🎓 {user.college}
              </div>
              <div className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-full flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>{user.name}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center space-x-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </header>

          {/* Core App Grid workspace */}
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] items-stretch">
            {/* LEFT COLUMN: Matches & Chats List */}
            <section className="lg:col-span-3 bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-[2rem] shadow-sm flex flex-col h-full overflow-hidden">
              <div className="mb-4">
                <h3 className="text-lg font-black text-slate-900 flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-indigo-600 fill-indigo-600/10" />
                  <span>My Roommate Matches</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Double-blind aligned college peers</p>
              </div>

              {/* Match Items Scrollable container */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                {matches.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center p-4 text-slate-400">
                    <Sparkles className="w-8 h-8 mb-2 text-slate-300 animate-pulse" />
                    <p className="text-xs font-semibold">No matches yet.</p>
                    <p className="text-[10px] mt-1">Swipe right on peers in the deck to create a connection.</p>
                  </div>
                ) : (
                  matches.map((match) => (
                    <button
                      key={match._id}
                      onClick={() => handleSelectChat(match)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center space-x-3 ${
                        activeChat?._id === match._id
                          ? 'bg-indigo-50/80 border-indigo-200 shadow-sm'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-cyan-50 border border-white text-indigo-600 font-black text-sm flex items-center justify-center shadow-inner uppercase">
                        {match.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h4 className="font-extrabold text-slate-800 text-xs truncate">{match.name}</h4>
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                            {match.compatibilityScore || 85}%
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate">{match.major || 'Undergrad'}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            {/* CENTER COLUMN: Interactive Swipe Deck & Compatibility Telemetry */}
            <section className="lg:col-span-5 flex flex-col justify-between h-full space-y-4">
              {/* Swipe Deck Workspace (fixed size viewport) */}
              <div className="flex-1 relative flex justify-center items-center min-h-[380px] bg-slate-100/30 rounded-[2.5rem] border border-slate-200/40 p-4">
                {currentIndex < deck.length ? (
                  <div className="relative w-full max-w-sm h-full flex justify-center items-center">
                    {/* Shadow card behind for deck depth */}
                    {currentIndex + 1 < deck.length && (
                      <SwipeCard
                        key={deck[currentIndex + 1]._id}
                        profile={deck[currentIndex + 1]}
                        active={false}
                      />
                    )}

                    {/* Active draggable top card */}
                    <SwipeCard
                      key={deck[currentIndex]._id}
                      profile={deck[currentIndex]}
                      active={true}
                      onSwipe={handleSwipeAction}
                    />
                  </div>
                ) : (
                  <div className="text-center p-8 bg-white/70 backdrop-blur-md border border-white/50 rounded-[2.5rem] shadow-sm max-w-sm">
                    <Activity className="w-10 h-10 text-indigo-600 mx-auto mb-3 animate-pulse" />
                    <h4 className="text-base font-bold text-slate-900">All caught up!</h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      No more active profiles in your range. Try updating your budget or lifestyle locks to discover new roommates!
                    </p>
                    <button 
                      onClick={() => fetchDiscoverDeck()}
                      className="mt-4 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-xl transition-all"
                    >
                      Reload Discoveries
                    </button>
                  </div>
                )}
              </div>

              {/* Deck buttons (visible if profile is active) */}
              {currentIndex < deck.length && (
                <div className="flex justify-center items-center space-x-4">
                  <button
                    onClick={() => handleSwipeAction('left', deck[currentIndex]._id)}
                    className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-500 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer animate-fade-in"
                    title="Pass profile"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => handleSwipeAction('right', deck[currentIndex]._id)}
                    className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-500 shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer animate-fade-in"
                    title="Connect / Right swipe"
                  >
                    <Heart className="w-6 h-6 fill-emerald-500/10" />
                  </button>
                </div>
              )}

              {/* COMPATIBILITY BREAKDOWN PANEL */}
              {currentIndex < deck.length && (
                <div className="bg-white/70 backdrop-blur-md border border-white/50 rounded-3xl p-4 shadow-sm space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                    <span>Compatibility breakdown vs {deck[currentIndex].name}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] pt-1">
                    {/* Sleep comparison */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Sleep alignment</span>
                        <span className="text-indigo-600">{(1 - Math.abs((user.preferences?.sleep || 0.5) - deck[currentIndex].preferences?.sleep)).toFixed(2) * 100}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(user.preferences?.sleep || 0.5) * 100}%` }} className="h-full bg-indigo-400" title="Your score"></div>
                        <div style={{ width: `${deck[currentIndex].preferences?.sleep * 100}%` }} className="h-full bg-cyan-455" title="Their score"></div>
                      </div>
                    </div>

                    {/* Cleanliness comparison */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Cleanliness match</span>
                        <span className="text-indigo-600">{(1 - Math.abs((user.preferences?.cleanliness || 0.5) - deck[currentIndex].preferences?.cleanliness)).toFixed(2) * 100}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(user.preferences?.cleanliness || 0.5) * 100}%` }} className="h-full bg-indigo-400"></div>
                        <div style={{ width: `${deck[currentIndex].preferences?.cleanliness * 100}%` }} className="h-full bg-cyan-400"></div>
                      </div>
                    </div>

                    {/* Social battery comparison */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Social energy match</span>
                        <span className="text-indigo-600">{(1 - Math.abs((user.preferences?.socialness || 0.5) - deck[currentIndex].preferences?.socialness)).toFixed(2) * 100}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(user.preferences?.socialness || 0.5) * 100}%` }} className="h-full bg-indigo-400"></div>
                        <div style={{ width: `${deck[currentIndex].preferences?.socialness * 100}%` }} className="h-full bg-cyan-400"></div>
                      </div>
                    </div>

                    {/* Diet match */}
                    <div className="space-y-0.5">
                      <div className="flex justify-between text-slate-500 font-bold">
                        <span>Dietary alignment</span>
                        <span className="text-indigo-600">{user.preferences?.diet === deck[currentIndex].preferences?.diet ? '100%' : '50%'}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                        <div style={{ width: `${(user.preferences?.diet || 0.5) * 100}%` }} className="h-full bg-indigo-400"></div>
                        <div style={{ width: `${deck[currentIndex].preferences?.diet * 100}%` }} className="h-full bg-cyan-400"></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-1 flex justify-between">
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-indigo-400 rounded-full inline-block"></span> <span>You</span></span>
                    <span className="flex items-center space-x-1"><span className="w-2 h-2 bg-cyan-400 rounded-full inline-block"></span> <span>Candidate</span></span>
                  </div>
                </div>
              )}
            </section>

            {/* RIGHT COLUMN: Real-Time WebSocket Chat Console */}
            <section className="lg:col-span-4 bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-[2rem] shadow-sm flex flex-col h-full overflow-hidden">
              {activeChat ? (
                <div className="flex flex-col h-full justify-between animate-fade-in">
                  {/* Chat partner header */}
                  <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-100 to-cyan-50 border border-white text-indigo-600 font-bold text-xs flex items-center justify-center uppercase shadow-inner">
                        {activeChat.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-xs">{activeChat.name}</h4>
                        <span className="text-[9px] text-slate-400">{activeChat.major}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveChat(null)}
                      className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      title="Close chat"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Message stream logs */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4 flex flex-col justify-end">
                    <div className="space-y-3 overflow-y-auto max-h-full">
                      {(chatMessages[activeChat._id] || []).map((msg, index) => {
                        const isMe = msg.senderId === user._id;
                        return (
                          <div 
                            key={index}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                              isMe 
                                ? 'bg-indigo-600 text-white rounded-br-none' 
                                : 'bg-slate-100/80 border border-slate-200/50 text-slate-800 rounded-bl-none'
                            }`}>
                              <p className="leading-normal">{msg.text}</p>
                              <span className={`text-[8px] mt-1 block text-right leading-none ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={chatBottomRef} />
                    </div>
                  </div>

                  {/* Input Form text field */}
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-150 p-1.5 rounded-2xl">
                    <input
                      type="text"
                      placeholder="Type a message to synchronize..."
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      className="flex-1 bg-transparent p-2 text-xs text-slate-800 focus:outline-none placeholder-slate-400"
                    />
                    <button
                      onClick={handleSendChatMessage}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl shadow-md hover:shadow-indigo-500/10 transition-all flex items-center justify-center cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-400 p-4">
                  <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-slate-300 animate-pulse" />
                  <p className="text-xs font-semibold">Private chat stream</p>
                  <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                    Select an institutional match from the left sidebar to open secure real-time chat links.
                  </p>
                </div>
              )}
            </section>
          </main>

          {/* Double-Blind Match overlay modal */}
          {newMatchModal && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
              <div className="max-w-md w-full bg-white border border-white/80 p-8 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden">
                {/* Modal Glows */}
                <div className="absolute -top-20 -left-20 w-44 h-44 bg-cyan-300/20 blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-indigo-300/20 blur-3xl pointer-events-none"></div>

                <Sparkles className="w-14 h-14 text-indigo-600 mx-auto mb-4 animate-bounce" />
                <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-2">It's a Roommate Match!</h2>
                <p className="text-xs text-slate-500 mb-6">
                  You and <span className="font-extrabold text-indigo-600">{newMatchModal.name}</span> swiped right on each other.
                </p>

                <div className="flex justify-center items-center space-x-6 mb-8">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-150 text-indigo-600 flex items-center justify-center text-2xl font-black shadow-inner uppercase">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-indigo-500 font-extrabold text-xl animate-pulse">&lt;&gt;</div>
                  <div className="w-16 h-16 rounded-full bg-cyan-50 border border-cyan-150 text-cyan-600 flex items-center justify-center text-2xl font-black shadow-inner uppercase">
                    {newMatchModal.name.charAt(0)}
                  </div>
                </div>

                <div className="flex flex-col space-y-2.5">
                  <button
                    onClick={() => {
                      handleSelectChat(newMatchModal);
                      setNewMatchModal(null);
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-xl shadow-lg hover:shadow-indigo-500/10 transition-all text-xs uppercase cursor-pointer"
                  >
                    Open Private Chat Room
                  </button>
                  <button
                    onClick={() => setNewMatchModal(null)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl text-xs uppercase transition-all cursor-pointer"
                  >
                    Keep discovering
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
