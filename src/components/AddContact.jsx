import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Search, UserPlus, CheckCircle2, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Pairing() {
  const { user, profile, refreshRelationship, signOut } = useAuth();
  const [searchUsername, setSearchUsername] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setLoading(true);
    setError(null);
    setFoundUser(null);

    try {
      if (searchUsername.trim().toLowerCase() === profile?.username.toLowerCase()) {
        throw new Error("You cannot add yourself.");
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', searchUsername.trim().toLowerCase())
        .single();

      if (error || !data) {
        throw new Error("User not found.");
      }

      setFoundUser(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async () => {
    if (!foundUser) return;
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('relationships')
        .insert([
          { user1_id: user.id, user2_id: foundUser.id }
        ]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error("You are already connected with this user.");
        }
        throw error;
      }
      
      await refreshRelationship();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        <div className="glass-card p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 text-glow">Add Contact</h2>
              {profile && (
                <p className="text-sm text-secondary mt-1">Your username: <span className="font-semibold text-gray-900">@{profile.username}</span></p>
              )}
            </div>
            <button onClick={signOut} className="text-secondary hover:text-gray-900 transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                <input
                  type="text"
                  value={searchUsername}
                  onChange={(e) => setSearchUsername(e.target.value)}
                  placeholder="Search username..."
                  className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none input-glow transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !searchUsername}
                className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-medium transition-colors disabled:opacity-50"
              >
                Find
              </button>
            </form>

            <AnimatePresence>
              {foundUser && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between mt-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                      {foundUser.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">@{foundUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAddContact}
                    disabled={loading}
                    className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" /> Add
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
