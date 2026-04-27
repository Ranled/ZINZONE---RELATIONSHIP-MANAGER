import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Check, Circle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlansTab() {
  const { user, relationship } = useAuth();
  const [plans, setPlans] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    fetchPlans();

    const subscription = supabase
      .channel('public:plans')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans', filter: `relationship_id=eq.${relationship.id}` }, (payload) => {
        fetchPlans();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [relationship]);

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .eq('relationship_id', relationship.id)
      .order('date', { ascending: true });
    
    if (!error && data) {
      setPlans(data);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    if (!title.trim() || !date || !relationship) return;
    setLoading(true);

    const { error } = await supabase
      .from('plans')
      .insert([
        {
          relationship_id: relationship.id,
          user_id: user.id,
          title: title.trim(),
          date: date
        }
      ]);

    if (!error) {
      setTitle('');
      setDate('');
      setIsAdding(false);
    }
    setLoading(false);
  };

  const toggleStatus = async (plan) => {
    const newStatus = plan.status === 'completed' ? 'pending' : 'completed';
    await supabase
      .from('plans')
      .update({ status: newStatus })
      .eq('id', plan.id);
  };

  return (
    <div className="space-y-6 pb-6 pt-4">
      <div className="flex justify-between items-center px-4">
        <h2 className="text-xl font-semibold text-gray-800">Our Plans</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Plan
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
            <form onSubmit={handleAddPlan} className="glass-card p-4 space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the plan?"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none input-glow transition-all"
                required
              />
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2">
                <Calendar className="w-5 h-5 text-secondary/70" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="flex-1 bg-transparent text-gray-900 focus:outline-none min-h-[30px]"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !title.trim() || !date}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5 font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Plan'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3 px-4">
        {plans.length === 0 && !isAdding ? (
          <div className="text-center py-12 text-secondary/60">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No plans yet. Start planning something fun!</p>
          </div>
        ) : (
          plans.map((plan) => {
            const isCompleted = plan.status === 'completed';
            const planDate = new Date(plan.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            
            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                key={plan.id}
                className={`glass-card p-4 flex items-center justify-between group transition-all ${isCompleted ? 'opacity-60' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleStatus(plan)} className="text-primary hover:scale-110 transition-transform">
                    {isCompleted ? <Check className="w-6 h-6 text-green-400" /> : <Circle className="w-6 h-6 text-secondary" />}
                  </button>
                  <div>
                    <h3 className={`text-gray-900 font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>{plan.title}</h3>
                    <p className="text-xs text-secondary/70 uppercase tracking-wider">{planDate}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
