import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import SwipeCard from './components/SwipeCard';
import { 
  Sparkles, ShieldAlert, Heart, X, MessageSquare, 
  MapPin, CheckCircle, Send, User, Compass
} from 'lucide-react';

// API Server Base URL
const API_BASE = 'http://localhost:5001/api';

// Fallback Mock Profiles (in case backend is not running or db is empty)
const FALLBACK_PROFILES = [
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
  },
  {
    _id: "65e21970b5c1fb3a7582b103",
    name: "Vikram Malhotra",
    age: 22,
    college: "GLA University",
    major: "Business Administration",
    bio: "Gym enthusiast, early riser, and clean freak. Budget is pretty flexible. Hit me up if you want to team up!",
    gender: "Male",
    preferences: { sleep: 0.2, cleanliness: 0.9, socialness: 0.6, diet: 0.5 },
    dealbreakers: { budgetMin: 1800, budgetMax: 3000, smokingAllowed: false, petsAllowed: false },
    compatibilityScore: 78
  }
];

const DEFAULT_CURRENT_USER = {
  _id: "65e21970b5c1fb3a7582b100",
  name: "Yash",
  age: 20,
  email: "yash@gla.ac.in",
  college: "GLA University",
  major: "Software Engineering",
  gender: "Male",
  preferences: { sleep: 0.7, cleanliness: 0.8, socialness: 0.5, diet: 0.6 },
  dealbreakers: { budgetMin: 1000, budgetMax: 2200, smokingAllowed: false, petsAllowed: true },
  location: { type: "Point", coordinates: [77.5946, 12.9716] } // Bangalore coordinates
};

function App() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_CURRENT_USER);
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [chatMessages, setChatMessages] = useState({});
  const [typedMessage, setTypedMessage] = useState('');
  const [newMatchModal, setNewMatchModal] = useState(null);
  
  // Verification State
  const [emailInput, setEmailInput] = useState('');
  const [isVerified, setIsVerified] = useState(true); // Defaults to verified for local sandbox
  const [verificationError, setVerificationError] = useState('');

  const socketRef = useRef(null);
  const chatBottomRef = useRef(null);

  // Initialize socket and fetch profiles
  useEffect(() => {
    socketRef.current = io('http://localhost:5001');

    socketRef.current.on('connect', () => {
      console.log('Connected to socket gateway');
      socketRef.current.emit('identify', currentUser._id);
    });

    socketRef.current.on('match_created', (data) => {
      // Find candidate details
      const matchedUser = deck.find(c => c._id === data.matchedUser) || 
                          FALLBACK_PROFILES.find(c => c._id === data.matchedUser);
      if (matchedUser) {
        setNewMatchModal(matchedUser);
        setMatches(prev => [...prev, matchedUser]);
      }
    });

    socketRef.current.on('receive_message', (message) => {
      const chatPartnerId = message.senderId === currentUser._id ? message.recipientId : message.senderId;
      setChatMessages(prev => ({
        ...prev,
        [chatPartnerId]: [...(prev[chatPartnerId] || []), message]
      }));
    });

    fetchProfiles();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [currentUser._id]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeChat]);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get(`${API_BASE}/matching/discover/${currentUser._id}`);
      if (response.data && response.data.length > 0) {
        setDeck(response.data);
      } else {
        setDeck(FALLBACK_PROFILES);
      }
      setCurrentIndex(0);
    } catch (error) {
      console.warn('Backend discovery failed. Loading fallback sandbox profiles.');
      setDeck(FALLBACK_PROFILES);
      setCurrentIndex(0);
    }
  };

  const handleSwipeAction = async (direction, candidateId) => {
    try {
      const response = await axios.post(`${API_BASE}/matching/swipe`, {
        userId: currentUser._id,
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
      console.warn('Swipe not synced to server. Simulated client-side match check.');
      // Simulate double-blind match logic in development sandbox mode
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

    // Advance stack index
    setCurrentIndex(prev => prev + 1);
  };

  const handleSendChatMessage = () => {
    if (!typedMessage.trim() || !activeChat) return;

    const newMessage = {
      senderId: currentUser._id,
      recipientId: activeChat._id,
      text: typedMessage.trim(),
      timestamp: new Date()
    };

    // Emit via socket
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('send_message', newMessage);
    } else {
      // In-memory chat fallback for offline development
      setChatMessages(prev => ({
        ...prev,
        [activeChat._id]: [...(prev[activeChat._id] || []), newMessage]
      }));

      // Simulate human reply
      setTimeout(() => {
        const reply = {
          senderId: activeChat._id,
          recipientId: currentUser._id,
          text: `Hey! Love your profile compatibility score of ${activeChat.compatibilityScore}%. Let's chat about flat options!`,
          timestamp: new Date()
        };
        setChatMessages(prev => ({
          ...prev,
          [activeChat._id]: [...(prev[activeChat._id] || []), reply]
        }));
      }, 1500);
    }

    setChatMessages(prev => ({
      ...prev,
      [activeChat._id]: [...(prev[activeChat._id] || []), newMessage]
    }));
    setTypedMessage('');
  };

  const handleSelectChat = async (match) => {
    setActiveChat(match);
    try {
      const response = await axios.get(`${API_BASE}/matching/chat/${currentUser._id}/${match._id}`);
      setChatMessages(prev => ({
        ...prev,
        [match._id]: response.data
      }));
    } catch (err) {
      console.warn('Backend chat history is offline. Operating in sandbox memory session.');
    }
  };

  const handleEmailVerification = async (e) => {
    e.preventDefault();
    setVerificationError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/verify-email`, { email: emailInput });
      setIsVerified(true);
      setCurrentUser(prev => ({ ...prev, email: emailInput }));
    } catch (err) {
      setVerificationError(err.response?.data?.error || 'Verification failed. Domain rejected.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-white relative overflow-hidden flex flex-col font-sans">
      {/* Midnight Aurora Glow Fields */}
      <div className="aurora-glow aurora-purple"></div>
      <div className="aurora-glow aurora-pink"></div>
      <div className="aurora-glow aurora-mint"></div>

      {/* Main Navbar */}
      <header className="border-b-4 border-black bg-cyber-card p-4 relative z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-cyber-purple p-2 rounded-lg border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <Compass className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-widest uppercase">
              Roommate<span className="text-cyber-mint">IQ</span>
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {isVerified ? (
              <div className="flex items-center space-x-2 bg-cyber-mint/20 border border-cyber-mint/40 text-cyber-mint px-3 py-1.5 rounded-lg text-xs font-semibold">
                <CheckCircle className="w-4 h-4" />
                <span>Verified .edu domain</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 bg-cyber-pink/20 border border-cyber-pink/40 text-cyber-pink px-3 py-1.5 rounded-lg text-xs font-semibold">
                <ShieldAlert className="w-4 h-4" />
                <span>Unverified email</span>
              </div>
            )}

            <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* App Body Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left Control / Profile Panel (4 Columns) */}
        <section className="lg:col-span-4 flex flex-col space-y-6">
          {/* Profile Card & Gating */}
          <div className="rounded-2xl border-4 border-black bg-cyber-card shadow-neobrutal p-5 flex flex-col">
            <h2 className="text-lg font-black uppercase text-cyber-purple tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center space-x-2">
              <span>My Profile Gateway</span>
            </h2>

            {!isVerified ? (
              <form onSubmit={handleEmailVerification} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Please verify your collegiate email credentials to unlock the matchmaking dashboard.
                </p>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold mb-1.5">Academic Email</label>
                  <input
                    type="email"
                    placeholder="name@gla.ac.in"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-cyber-bg border-2 border-black p-2.5 rounded-lg text-sm text-white focus:outline-none focus:border-cyber-purple"
                  />
                  {verificationError && (
                    <p className="text-xs text-cyber-pink mt-1 font-semibold">{verificationError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full bg-cyber-purple text-black font-extrabold py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all text-sm uppercase"
                >
                  Verify Domain
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 bg-cyber-bg p-3 rounded-lg border-2 border-black">
                  <div className="w-10 h-10 rounded-full bg-cyber-purple flex items-center justify-center font-bold text-black">
                    Y
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
                    <p className="text-xs text-slate-400">{currentUser.email}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sleep preference:</span>
                    <span className="font-semibold">{currentUser.preferences.sleep}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cleanliness score:</span>
                    <span className="font-semibold">{currentUser.preferences.cleanliness}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Budget Range:</span>
                    <span className="font-semibold text-cyber-mint">
                      ₹{currentUser.dealbreakers.budgetMin} - ₹{currentUser.dealbreakers.budgetMax}/mo
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Matches Panel */}
          <div className="flex-1 rounded-2xl border-4 border-black bg-cyber-card shadow-neobrutal p-5 flex flex-col min-h-[300px]">
            <h2 className="text-lg font-black uppercase text-cyber-mint tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center justify-between">
              <span>My Matches</span>
              <span className="bg-cyber-mint text-black font-black text-xs px-2 py-0.5 rounded-full">
                {matches.length}
              </span>
            </h2>

            {matches.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center text-center p-6 text-slate-500">
                <Heart className="w-8 h-8 mb-2 animate-pulse" />
                <p className="text-xs">No double-blind matches established yet. Swipe right to start matching!</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1">
                {matches.map((match) => (
                  <button
                    key={match._id}
                    onClick={() => handleSelectChat(match)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-left transition-all ${
                      activeChat && activeChat._id === match._id
                        ? 'bg-cyber-purple/20 border-cyber-purple shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                        : 'bg-cyber-bg border-black hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-full bg-cyber-pink text-black flex items-center justify-center font-bold text-xs uppercase border-2 border-black">
                        {match.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-white">{match.name}</h4>
                        <p className="text-[10px] text-cyber-mint">{match.major}</p>
                      </div>
                    </div>
                    <div className="bg-black/60 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                      {match.compatibilityScore}% match
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Center Swipe Deck Area (5 Columns) */}
        <section className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[550px]">
          {currentIndex < deck.length ? (
            <div className="relative w-full max-w-sm h-[520px] flex items-center justify-center">
              {deck.slice(currentIndex, currentIndex + 2).reverse().map((profile, i, arr) => {
                const isTop = i === arr.length - 1;
                return (
                  <SwipeCard
                    key={profile._id}
                    profile={profile}
                    active={isTop}
                    onSwipe={handleSwipeAction}
                  />
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border-4 border-black bg-cyber-card shadow-neobrutal p-8 text-center max-w-sm w-full py-16">
              <Sparkles className="w-12 h-12 text-cyber-purple mx-auto mb-4 animate-bounce" />
              <h3 className="text-xl font-black uppercase text-white mb-2">No Roommates Near You</h3>
              <p className="text-xs text-slate-400 mb-6 px-4">
                You've completed your vector swipes for today. Adjust your geographical filter or check back later!
              </p>
              <button
                onClick={fetchProfiles}
                className="bg-cyber-mint text-black font-extrabold px-6 py-2.5 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase"
              >
                Scan Campus Again
              </button>
            </div>
          )}

          {/* Swipe Buttons (Visual Helper) */}
          {currentIndex < deck.length && (
            <div className="flex space-x-6 mt-6 relative z-20">
              <button
                onClick={() => handleSwipeAction('left', deck[currentIndex]._id)}
                className="bg-cyber-pink hover:bg-cyber-pink/90 text-black p-4 rounded-full border-4 border-black shadow-neobrutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <X className="w-6 h-6 text-black stroke-[3px]" />
              </button>
              <button
                onClick={() => handleSwipeAction('right', deck[currentIndex]._id)}
                className="bg-cyber-mint hover:bg-cyber-mint/90 text-black p-4 rounded-full border-4 border-black shadow-neobrutal active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                <Heart className="w-6 h-6 text-black fill-black stroke-[2px]" />
              </button>
            </div>
          )}
        </section>

        {/* Right Chat Panel (3 Columns) */}
        <section className="lg:col-span-3 rounded-2xl border-4 border-black bg-cyber-card shadow-neobrutal p-4 flex flex-col min-h-[450px]">
          <h2 className="text-lg font-black uppercase text-cyber-pink tracking-widest border-b border-slate-800 pb-2 mb-4 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-cyber-pink" />
            <span>Live Chat Console</span>
          </h2>

          {activeChat ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Active Chat Header */}
              <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-800/80">
                <div className="w-7 h-7 rounded-full bg-cyber-purple text-black flex items-center justify-center font-bold text-xs uppercase border border-black">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-white">{activeChat.name}</h4>
                  <p className="text-[9px] text-cyber-mint">Secure WebSocket Link Active</p>
                </div>
              </div>

              {/* Chat Message Logs */}
              <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-1 text-xs mb-4">
                {(chatMessages[activeChat._id] || []).length === 0 ? (
                  <p className="text-center text-slate-500 italic mt-6">Send a secure message to start the conversation.</p>
                ) : (
                  (chatMessages[activeChat._id] || []).map((msg, idx) => {
                    const isMe = msg.senderId === currentUser._id;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`p-2.5 rounded-lg border-2 border-black max-w-[85%] leading-relaxed ${
                            isMe
                              ? 'bg-cyber-purple text-black font-semibold rounded-tr-none'
                              : 'bg-cyber-bg text-slate-200 rounded-tl-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef}></div>
              </div>

              {/* Input Area */}
              <div className="flex items-center space-x-2 border-2 border-black bg-cyber-bg p-1 rounded-lg">
                <input
                  type="text"
                  placeholder="Encrypt message..."
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  className="flex-1 bg-transparent p-2 text-xs text-white focus:outline-none placeholder-slate-500"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="bg-cyber-pink text-black p-2 rounded-md border border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center text-center text-slate-500 p-4">
              <MessageSquare className="w-8 h-8 mb-2 opacity-30 animate-pulse" />
              <p className="text-xs">Select a match from the sidebar to open a real-time message stream.</p>
            </div>
          )}
        </section>
      </main>

      {/* Double-Blind Match Found Modal Overlay */}
      {newMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-cyber-card border-4 border-black p-8 rounded-2xl shadow-glow text-center relative overflow-hidden">
            {/* Modal Aurora */}
            <div className="absolute -top-20 -left-20 w-44 h-44 bg-cyber-mint/20 blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-cyber-purple/20 blur-3xl pointer-events-none"></div>

            <Sparkles className="w-16 h-16 text-cyber-mint mx-auto mb-4 animate-spin-slow" />
            <h2 className="text-3xl font-black uppercase tracking-wider text-white mb-2">It's a Match!</h2>
            <p className="text-xs text-slate-400 mb-6">
              You and <span className="font-extrabold text-cyber-mint">{newMatchModal.name}</span> swiped right on each other.
            </p>

            <div className="flex justify-center items-center space-x-6 mb-8">
              <div className="w-16 h-16 rounded-full border-4 border-black bg-cyber-purple text-black flex items-center justify-center text-2xl font-black">
                Y
              </div>
              <div className="text-cyber-pink font-extrabold text-xl animate-pulse">&lt;&gt;</div>
              <div className="w-16 h-16 rounded-full border-4 border-black bg-cyber-mint text-black flex items-center justify-center text-2xl font-black">
                {newMatchModal.name.charAt(0)}
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  handleSelectChat(newMatchModal);
                  setNewMatchModal(null);
                }}
                className="w-full bg-cyber-purple text-black font-extrabold py-3 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-xs uppercase"
              >
                Launch Secure Chat Link
              </button>
              <button
                onClick={() => setNewMatchModal(null)}
                className="w-full bg-slate-800 text-slate-300 font-extrabold py-2.5 rounded-lg border border-slate-700 text-xs uppercase hover:bg-slate-700/80"
              >
                Keep Swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
