import React from 'react';
import { GlobalConfig } from '../types';
import { motion } from 'motion/react';
import { PartyPopper } from 'lucide-react';

export function AnnouncementView({ config }: { config: GlobalConfig }) {
  const isGirl = config.gender === 'girl';

  return (
    <div className="max-w-4xl mx-auto py-12 md:py-24 px-6 flex flex-col items-center text-center">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="inline-flex items-center gap-3 border border-black/5 bg-white px-6 py-2 text-[10px] font-sans font-bold tracking-widest uppercase text-black mb-8 shadow-sm">
          <span>The Wait is Over</span>
        </div>
      </motion.div>

      <motion.h1 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        transition={{ delay: 0.3, duration: 0.8 }}
        className="text-6xl md:text-8xl font-serif tracking-tighter mb-6 leading-[0.9]"
      >
        Welcome,<br />
        <span className="italic">
          {config.babyName}
        </span>
      </motion.h1>

      {config.stats && (
        <motion.p 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.6, duration: 0.8 }}
          className="font-sans text-sm tracking-widest uppercase text-black/60 mb-16"
        >
          {config.stats}
        </motion.p>
      )}

      {config.photoDataUrl && (
        <motion.div 
          initial={{ y: 40, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.9, duration: 1 }}
          className="relative overflow-hidden border border-black/5 bg-white p-2 md:p-4 max-w-2xl w-full shadow-sm"
        >
          <img 
            src={config.photoDataUrl} 
            alt={`Baby ${config.babyName}`} 
            className="w-full h-auto object-cover grayscale opacity-90"
          />
        </motion.div>
      )}
    </div>
  );
}
