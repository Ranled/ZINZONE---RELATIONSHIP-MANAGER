import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Award, CalendarHeart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MilestonesTab() {
  const { user, relationship } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    fetchMilestones();
  }, [relationship]);

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('relationship_id', relationship.id)
      .order('date', { ascending: false }); // Newest first
    
    if (!error && data) {
      setMilestones(data);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !relationship) return;
    setLoading(true);

    const { error } = await supabase
      .from('milestones')
      .insert([
        {
          relationship_id: relationship.id,
          title: title.trim(),
          date: date
        }
      ]);

    if (!error) {
      setTitle('');
      setDate('');
      setIsAdding(false);
      fetchMilestones();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-6 pt-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-xl font-semibold text-white/90">Milestones</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors"
        >
          <Plus className={`w-5 h-5 transition-transform duration-300 ${isAdding ? 'rotate-45 text-accent' : ''}`} />
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4"
          >
            <form onSubmit={handleAddMilestone} className="glass-card p-4 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. First Date, Anniversary..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none input-glow transition-all"
                required
              />
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2">
                <CalendarHeart className="w-5 h-5 text-secondary/70" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-white focus:outline-none min-h-[30px]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !title.trim() || !date}
                className="w-full bg-gradient-to-r from-accent to-primary hover:opacity-90 text-white rounded-xl py-2.5 font-medium transition-all shadow-lg shadow-accent/20 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Milestone'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 relative">
        {/* Timeline line */}
        {milestones.length > 0 && (
          <div className="absolute left-[31px] top-4 bottom-4 w-px bg-white/10"></div>
        )}

        <div className="space-y-6">
          {milestones.length === 0 && !isAdding ? (
            <div className="text-center py-12 text-secondary/60">
              <Award className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No milestones yet. Mark your special days here!</p>
            </div>
          ) : (
            milestones.map((milestone, idx) => {
              const dateObj = new Date(milestone.date);
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={milestone.id}
                  className="relative flex items-center gap-6"
                >
                  <div className="w-4 h-4 rounded-full bg-accent relative z-10 shadow-[0_0_10px_rgba(244,114,182,0.8)] border-2 border-[#0F0F1A]"></div>
                  
                  <div className="glass-card p-4 flex-1 hover:bg-white/10 transition-colors">
                    <h3 className="text-lg font-medium text-white/90">{milestone.title}</h3>
                    <p className="text-sm text-secondary/80 mt-1">
                      {dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
