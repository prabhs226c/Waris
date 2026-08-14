import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { GlobalConfig } from './types';
import { VotingDashboard } from './components/VotingDashboard';
import { AnnouncementView } from './components/AnnouncementView';
import { AdminPortal } from './components/AdminPortal';
import { Baby, Lock } from 'lucide-react';
import { motion } from 'motion/react';

const INVITE_CODE = "BABY2026";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GlobalConfig | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codePassed, setCodePassed] = useState(false);
  const [adminMode, setAdminMode] = useState(false);

  useEffect(() => {
    // Check local storage for invite code bypass
    if (localStorage.getItem('inviteCodePassed') === 'true') {
      setCodePassed(true);
    }

    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!config && currentUser) {
        setLoading(false); // don't wait forever if config is missing
      } else if (!currentUser) {
        setLoading(false);
      }
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as GlobalConfig);
      } else {
        // Fallback config if it doesn't exist yet
        setConfig({ status: 'voting', updatedAt: Date.now() });
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      unsubConfig();
    };
  }, []);

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredCode.toUpperCase() === INVITE_CODE) {
      setCodePassed(true);
      localStorage.setItem('inviteCodePassed', 'true');
    } else {
      alert("Invalid invite code.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="animate-pulse text-orange-400 flex flex-col items-center">
          <Baby className="w-12 h-12 mb-4" />
          <p className="font-medium tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.email === 'prabhs36@gmail.com';

  if (!codePassed && !user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 shadow-sm border border-black/5 max-w-md w-full text-center flex flex-col"
        >
          <div className="mx-auto mb-8 text-black/20">
            <Lock className="w-12 h-12" strokeWidth={1} />
          </div>
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] font-bold text-black/40 mb-2">Verified Access Only</span>
          <h1 className="text-4xl leading-[0.9] tracking-tighter mb-4 font-serif italic">Private Invite</h1>
          <p className="font-sans text-sm leading-relaxed text-black/60 mb-8">Enter the secret code to join the baby name voting pool.</p>
          <form onSubmit={verifyCode} className="space-y-4">
            <input 
              type="text" 
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value)}
              placeholder="Enter Code"
              className="w-full font-sans text-sm p-4 bg-[#FAF7F2] border-none focus:ring-0 placeholder:text-black/20 italic text-center uppercase tracking-widest"
            />
            <button type="submit" className="w-full text-[10px] font-sans uppercase font-bold tracking-widest px-6 py-4 bg-black text-white hover:bg-black/80 transition-colors">
              Unlock
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 md:p-12 shadow-sm border border-black/5 max-w-md w-full text-center flex flex-col"
        >
          <div className="mx-auto mb-8 text-black/20">
            <Baby className="w-12 h-12" strokeWidth={1} />
          </div>
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] font-bold text-black/40 mb-2">Collective Voices</span>
          <h1 className="text-4xl leading-[0.9] tracking-tighter mb-4 font-serif italic">Baby Naming</h1>
          <p className="font-sans text-sm leading-relaxed text-black/60 mb-8">Sign in to suggest and vote for your favorite baby names before December 22.</p>
          <button 
            onClick={handleSignIn}
            className="w-full border border-black/10 text-[10px] font-sans uppercase font-bold tracking-widest py-4 hover:bg-black hover:text-white flex items-center justify-center gap-3 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </motion.div>
      </div>
    );
  }

  const isAnnounced = config?.status === 'announced';

  return (
    <div className="min-h-screen flex flex-col font-serif select-none overflow-x-hidden">
      <nav className="w-full border-b border-black/5 px-6 md:px-10 py-6 flex justify-between items-end">
        <div className="flex flex-col">
          <span className="text-[10px] font-sans uppercase tracking-[0.3em] font-bold text-black/40 mb-1">Project Narrative</span>
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-black/40" strokeWidth={1.5} />
            <h1 className="text-2xl italic tracking-tight font-medium">Baby2026</h1>
          </div>
        </div>
        <div className="flex gap-4 md:gap-8 items-center">
          {isAdmin && (
            <button 
              onClick={() => setAdminMode(!adminMode)}
              className="text-[10px] font-sans uppercase font-bold tracking-widest px-4 md:px-6 py-2 bg-black text-white rounded-full hover:bg-black/80 transition-colors"
            >
              {adminMode ? 'Exit Admin' : 'Admin Access'}
            </button>
          )}
          <div className="text-right hidden sm:block">
            <span className="block text-[10px] font-sans uppercase tracking-widest text-black/40">Expected Arrival</span>
            <span className="text-lg font-medium tracking-tighter">Dec 22, 2026</span>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="text-[10px] font-sans uppercase font-bold tracking-widest border border-black/10 px-4 py-2 hover:bg-black hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center">
        {adminMode ? (
          <div className="py-8 w-full"><AdminPortal /></div>
        ) : isAnnounced ? (
          <AnnouncementView config={config!} />
        ) : (
          <VotingDashboard />
        )}
      </main>
    </div>
  );
}
