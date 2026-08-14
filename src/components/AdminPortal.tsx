import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GlobalConfig, OperationType } from '../types';
import { handleFirestoreError } from '../lib/utils';
import { Upload, CheckCircle } from 'lucide-react';

export function AdminPortal() {
  const [photo, setPhoto] = useState<string>('');
  const [babyName, setBabyName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [stats, setStats] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1000000) {
        alert("File too large (max 1MB). Please select a smaller photo.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const publishAnnouncement = async () => {
    if (!babyName || !photo) {
      alert("Please provide the name and a photo.");
      return;
    }
    setSaving(true);
    try {
      const configDoc: GlobalConfig = {
        status: 'announced',
        babyName,
        gender,
        photoDataUrl: photo,
        stats,
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'config', 'global'), configDoc);
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/global');
    } finally {
      setSaving(false);
    }
  };

  const resetToVoting = async () => {
    setSaving(true);
    try {
      const configDoc: GlobalConfig = {
        status: 'voting',
        updatedAt: Date.now(),
      };
      await setDoc(doc(db, 'config', 'global'), configDoc);
      setSuccess(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/global');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-black/5 p-8 md:p-12 shadow-sm font-sans">
      <h2 className="text-3xl font-serif font-medium text-black mb-8 italic">Admin Control</h2>
      {success && (
        <div className="mb-6 p-4 bg-[#FAF7F2] border border-black/5 text-black text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Update successful.</span>
        </div>
      )}
      <div className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest text-black/60 font-bold mb-2">Status Action</label>
          <div className="flex gap-4">
            <button
              onClick={publishAnnouncement}
              disabled={saving}
              className="flex-1 bg-black text-white py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              Publish Reveal
            </button>
            <button
              onClick={resetToVoting}
              disabled={saving}
              className="flex-1 bg-[#FAF7F2] text-black border border-black/5 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-black/5 transition-colors disabled:opacity-50"
            >
              Reset to Voting
            </button>
          </div>
        </div>

        <div className="pt-6 border-t border-black/5">
          <h3 className="text-[10px] uppercase tracking-widest text-black/60 font-bold mb-4">Announcement Details</h3>
          <div className="space-y-4">
            <div>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF7F2] border-none focus:ring-0 outline-none text-sm italic placeholder:text-black/30"
                placeholder="Baby Name (e.g., Arthur James)"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'boy' | 'girl')}
                className="flex-1 px-4 py-3 bg-[#FAF7F2] border-none focus:ring-0 outline-none text-sm cursor-pointer"
              >
                <option value="boy">Boy</option>
                <option value="girl">Girl</option>
              </select>
              <input
                type="text"
                value={stats}
                onChange={(e) => setStats(e.target.value)}
                className="flex-[2] px-4 py-3 bg-[#FAF7F2] border-none focus:ring-0 outline-none text-sm italic placeholder:text-black/30"
                placeholder="Stats (e.g., 7 lbs 4 oz)"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-black/60 font-bold mb-2">Upload Photo</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border border-black/10 border-dashed hover:border-black/30 transition-colors bg-[#FAF7F2]">
                <div className="space-y-2 text-center">
                  {photo ? (
                    <img src={photo} alt="Preview" className="mx-auto h-32 object-cover grayscale opacity-90 shadow-sm" />
                  ) : (
                    <Upload className="mx-auto h-8 w-8 text-black/20" />
                  )}
                  <div className="flex text-[10px] font-sans justify-center mt-4">
                    <label className="relative cursor-pointer font-bold uppercase tracking-widest border-b border-black/20 hover:border-black transition-colors">
                      <span>Select File</span>
                      <input type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                    </label>
                  </div>
                  <p className="text-[10px] text-black/40 uppercase tracking-widest">Max 1MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
