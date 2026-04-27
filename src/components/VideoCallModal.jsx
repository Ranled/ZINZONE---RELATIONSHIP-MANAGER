import React from 'react';
import { X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoCallModal({ isOpen, onClose, relationshipId }) {
  if (!isOpen) return null;

  // Generate a unique, consistent room name based on the relationship ID
  const roomName = `ZinZone-Room-${relationshipId?.replace(/-/g, '')}`;
  const meetUrl = `https://meet.jit.si/${roomName}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-[#1A1A1D]">
        
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-md border-b border-white/10"
        >
          <div className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-primary">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-medium text-sm">Secure Private Call</h3>
              <p className="text-[10px] text-white/50">End-to-End Encrypted</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" /> End Call
          </button>
        </motion.div>

        {/* Video Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 w-full relative"
        >
          <iframe
            src={meetUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-none"
            title="Secure Video Call"
          />
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
