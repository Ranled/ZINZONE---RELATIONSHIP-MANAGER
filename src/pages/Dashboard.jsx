import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Image as ImageIcon, Sparkles, LogOut, Home, Calendar, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AddContact from '../components/AddContact';
import ProfileModal from '../components/ProfileModal';
import HomeTab from '../components/HomeTab';
import ChatTab from '../components/ChatTab';
import PlansTab from '../components/PlansTab';
import MilestonesTab from '../components/MilestonesTab';
import ReflectionsTab from '../components/ReflectionsTab';
import MapTab from '../components/MapTab';

export default function Dashboard() {
  const { signOut, relationship, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
    { id: 'plans', label: 'Plans', icon: Calendar },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'reflections', label: 'Reflect', icon: Sparkles },
    { id: 'map', label: 'Map', icon: MapPin },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="glass z-10 sticky top-0">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 text-glow tracking-tight">ZinZone</h1>
          
          <button 
            onClick={() => setIsProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden hover:scale-105 transition-transform"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              profile?.username?.charAt(0).toUpperCase() || '?'
            )}
          </button>
        </div>
      </header>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-0 md:p-4 z-10 flex flex-col h-[calc(100vh-8rem)] relative">
        <AnimatePresence mode="wait">
          {!relationship ? (
            <motion.div key="add-contact" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto">
              <AddContact />
            </motion.div>
          ) : activeTab === 'home' ? (
            <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto">
              <HomeTab />
            </motion.div>
          ) : activeTab === 'chat' ? (
            <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 flex flex-col h-full overflow-hidden p-2 md:p-0">
              <ChatTab />
            </motion.div>
          ) : activeTab === 'plans' ? (
            <motion.div key="plans" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto">
              <PlansTab />
            </motion.div>
          ) : activeTab === 'milestones' ? (
            <motion.div key="milestones" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto">
              <MilestonesTab />
            </motion.div>
          ) : activeTab === 'reflections' ? (
            <motion.div key="reflections" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto">
              <ReflectionsTab />
            </motion.div>
          ) : activeTab === 'map' ? (
            <motion.div key="map" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="flex-1 overflow-y-auto flex flex-col p-2 md:p-0">
              <MapTab />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      {relationship && (
        <nav className="glass z-10 sticky bottom-0 pb-safe">
          <div className="max-w-md mx-auto flex justify-between px-2 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-center justify-center p-1 md:p-2 rounded-xl transition-all relative flex-1 ${
                    isActive ? 'text-primary' : 'text-secondary hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-primary/10 rounded-xl border border-primary/20"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-5 h-5 md:w-6 md:h-6 relative z-10 ${isActive ? 'drop-shadow-sm' : ''}`} />
                  <span className="text-[9px] md:text-[10px] mt-1 font-medium relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
