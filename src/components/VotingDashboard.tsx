import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, onSnapshot, doc, setDoc, getDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { BabyName, Vote, OperationType } from '../types';
import { handleFirestoreError, cn } from '../lib/utils';
import { Heart, Plus, Search } from 'lucide-react';

// Simple Levenshtein distance for duplicate detection
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  let i, j;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  for (i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (i = 1; i <= b.length; i++) {
    for (j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function VotingDashboard() {
  const [names, setNames] = useState<BabyName[]>([]);
  const [newName, setNewName] = useState('');
  const [newGender, setNewGender] = useState<'boy' | 'girl'>('boy');
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'names'), orderBy('voteCount', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedNames = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BabyName));
      setNames(fetchedNames);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'names');
    });

    return () => unsubscribe();
  }, []);

  // Check which names the user has already voted for
  useEffect(() => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    const unsubscribes = names.map(name => {
      if (!name.id) return () => {};
      const voteRef = doc(db, `names/${name.id}/votes/${uid}`);
      return onSnapshot(voteRef, (snap) => {
        setVotedIds(prev => {
          const next = new Set(prev);
          if (snap.exists()) next.add(name.id!);
          else next.delete(name.id!);
          return next;
        });
      });
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [names.length]);

  const similarNames = useMemo(() => {
    if (!newName.trim()) return [];
    return names.filter(n => {
      const dist = levenshteinDistance(n.name.toLowerCase(), newName.toLowerCase().trim());
      return dist <= 2;
    });
  }, [newName, names]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !auth.currentUser) return;
    
    if (similarNames.length > 0) {
      const confirmed = window.confirm(`There are similar names already suggested: ${similarNames.map(n => n.name).join(', ')}. Do you still want to submit this?`);
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      const newNameRef = doc(collection(db, 'names'));
      const nameData: BabyName = {
        name: newName.trim(),
        gender: newGender,
        submittedBy: auth.currentUser.displayName || 'Guest',
        submitterUid: auth.currentUser.uid,
        voteCount: 0,
        createdAt: Date.now()
      };
      await setDoc(newNameRef, nameData);
      setNewName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'names');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (nameId: string, currentVotes: number) => {
    if (!auth.currentUser || votedIds.has(nameId)) return;
    const uid = auth.currentUser.uid;
    try {
      const nameRef = doc(db, 'names', nameId);
      const voteRef = doc(db, `names/${nameId}/votes/${uid}`);
      
      // Since rules require existing voteCount + 1, we simulate it here. 
      // In production you might want a transaction, but rules enforce exact +1.
      await setDoc(nameRef, { voteCount: currentVotes + 1 }, { merge: true });
      await setDoc(voteRef, {
        uid,
        votedAt: Date.now()
      } as Vote);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `names/${nameId}`);
    }
  };

  const filteredNames = names.filter(n => n.name.toLowerCase().includes(filter.toLowerCase()));
  const girls = filteredNames.filter(n => n.gender === 'girl');
  const boys = filteredNames.filter(n => n.gender === 'boy');

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full max-w-[1440px] mx-auto bg-[#FAF7F2]">
      <aside className="w-full md:w-[320px] lg:w-[400px] md:border-r border-b md:border-b-0 border-black/5 p-6 md:p-10 flex flex-col justify-between">
        <div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl leading-[0.9] tracking-tighter mb-8 font-serif">Help us<br/>write their<br/><span className="italic">first</span> line.</h2>
          <p className="font-sans text-sm leading-relaxed text-black/60 mb-8">
            Every name carries a rhythm. Every choice is a legacy. Join us in curating the list for our newest arrival.
          </p>
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Suggest a name..."
              className="w-full font-sans text-sm p-4 bg-white border border-black/5 focus:ring-0 placeholder:text-black/20 italic shadow-sm outline-none"
              maxLength={50}
            />
            <div className="flex gap-2">
              <select
                value={newGender}
                onChange={(e) => setNewGender(e.target.value as 'boy' | 'girl')}
                className="flex-1 font-sans text-[10px] uppercase font-bold tracking-widest p-4 bg-white border border-black/5 text-black/80 shadow-sm outline-none cursor-pointer"
              >
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
              <button
                type="submit"
                disabled={!newName.trim() || submitting}
                className="flex-1 bg-black text-white text-[10px] font-sans uppercase font-bold tracking-widest p-4 hover:bg-black/80 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Suggest
              </button>
            </div>
          </form>

          <div className="mb-8 pt-4 border-t border-black/5 relative">
            <input 
              type="text" 
              placeholder="Filter registry..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full font-sans text-sm py-4 bg-transparent border-none outline-none focus:ring-0 placeholder:text-black/20 italic"
            />
          </div>
        </div>
        
        {similarNames.length > 0 && (
          <div className="p-6 bg-white border border-black/5 shadow-sm mt-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <span className="text-[10px] font-sans uppercase font-bold tracking-tighter">System Check</span>
            </div>
            <p className="font-sans text-[11px] leading-tight text-black/50 italic">
              '{similarNames[0].name}' is already on the roster. Try something unique?
            </p>
          </div>
        )}
      </aside>

      <section className="flex-1 grid md:grid-cols-2 bg-white min-h-[500px]">
        <div className="relative flex flex-col border-b md:border-b-0 md:border-r border-black/5">
          <div className="absolute top-10 right-10 opacity-[0.03] text-[120px] md:text-[180px] font-bold leading-none select-none pointer-events-none font-serif">01</div>
          <div className="p-8 md:p-12 h-full flex flex-col z-10">
            <div className="mb-auto">
              <span className="inline-block px-3 py-1 bg-[#FDECF2] text-[#D8628E] rounded-full text-[10px] font-sans font-bold uppercase tracking-widest mb-8">The Girl Registry</span>
              <ul className="space-y-8">
                {girls.map(name => (
                  <NameCard 
                    key={name.id} 
                    name={name} 
                    hasVoted={name.id ? votedIds.has(name.id) : false} 
                    onVote={() => name.id && handleVote(name.id, name.voteCount)} 
                  />
                ))}
                {girls.length === 0 && <li className="text-sm font-sans text-black/40 italic">No entries yet.</li>}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="relative flex flex-col">
          <div className="absolute top-10 right-10 opacity-[0.03] text-[120px] md:text-[180px] font-bold leading-none select-none pointer-events-none font-serif">02</div>
          <div className="p-8 md:p-12 h-full flex flex-col z-10">
            <div className="mb-auto">
              <span className="inline-block px-3 py-1 bg-[#EAF5FD] text-[#5A9ACF] rounded-full text-[10px] font-sans font-bold uppercase tracking-widest mb-8">The Boy Registry</span>
              <ul className="space-y-8">
                {boys.map(name => (
                  <NameCard 
                    key={name.id} 
                    name={name} 
                    hasVoted={name.id ? votedIds.has(name.id) : false} 
                    onVote={() => name.id && handleVote(name.id, name.voteCount)} 
                  />
                ))}
                {boys.length === 0 && <li className="text-sm font-sans text-black/40 italic">No entries yet.</li>}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function NameCard({ name, hasVoted, onVote }: { name: BabyName, hasVoted: boolean, onVote: () => void }) {
  return (
    <li className="flex justify-between items-center group">
      <div className="flex flex-col">
        <span className="text-2xl tracking-tight font-serif">{name.name}</span>
        <span className="text-[9px] font-sans uppercase tracking-widest text-black/30 mt-1">By {name.submittedBy}</span>
      </div>
      <button 
        onClick={onVote}
        disabled={hasVoted}
        className={cn(
          "font-sans text-[10px] font-bold uppercase border px-4 py-2 transition-colors cursor-pointer",
          hasVoted 
            ? "bg-black text-white border-black" 
            : "border-black/10 text-black hover:bg-black hover:text-white"
        )}
      >
        Vote ({name.voteCount})
      </button>
    </li>
  );
}
