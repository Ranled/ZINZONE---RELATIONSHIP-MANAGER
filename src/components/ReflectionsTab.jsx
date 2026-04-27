import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const PROMPTS = [
  "What is a small thing your partner did recently that made you smile?",
  "What are you most looking forward to doing together this year?",
  "Describe a moment when you felt truly supported by your partner.",
  "What is one of your favorite memories of us?",
  "How has our relationship helped you grow?",
  "What is something new you'd like us to try together?",
];

export default function ReflectionsTab() {
  const { user, relationship } = useAuth();
  const [reflections, setReflections] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0]);
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    fetchReflections();
    // Pick a random prompt daily or just randomly on load
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  }, [relationship]);

  const fetchReflections = async () => {
    const { data, error } = await supabase
      .from('reflections')
      .select('*, profiles(username)')
      .eq('relationship_id', relationship.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Fetch Reflections Error:", error);
    } else if (data) {
      setReflections(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response.trim() || !relationship) return;
    setLoading(true);

    const { error } = await supabase
      .from('reflections')
      .insert([
        {
          relationship_id: relationship.id,
          user_id: user.id,
          prompt: currentPrompt,
          response: response.trim()
        }
      ]);

    if (!error) {
      setResponse('');
      setShowSuccess(true);
      fetchReflections();
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Optionally cycle to a new prompt
      setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 pb-8 max-w-2xl mx-auto w-full px-2 mt-4">
      {/* Reflection Input Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Sparkles className="w-6 h-6 text-accent" />
          </div>
          <h2 className="text-xl font-medium text-gray-800 leading-tight">
            {currentPrompt}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Reflect on this..."
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none input-glow transition-all resize-none h-32 text-lg font-light leading-relaxed"
            />
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-2xl z-10"
              >
                <div className="flex flex-col items-center text-accent">
                  <CheckCircle className="w-10 h-10 mb-2" />
                  <span className="font-medium">Shared</span>
                </div>
              </motion.div>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !response.trim() || showSuccess}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl px-8 py-3 font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
            >
              {loading ? 'Sharing...' : 'Share Reflection'}
            </button>
          </div>
        </form>
      </motion.div>

      {/* Past Reflections List */}
      <div className="space-y-6">
        <h3 className="text-sm font-medium text-secondary uppercase tracking-widest pl-2">Past Reflections</h3>
        
        {reflections.length === 0 ? (
          <div className="text-center py-8 text-secondary/50">
            No reflections yet. Be the first to share!
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((ref, idx) => {
              const isMe = ref.user_id === user.id;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={ref.id}
                  className={`p-5 rounded-2xl border ${
                    isMe 
                      ? 'bg-primary/10 border-primary/20 ml-8' 
                      : 'bg-white border-gray-200 mr-8'
                  }`}
                >
                  <p className="text-xs text-secondary/70 mb-2 italic">"{ref.prompt}"</p>
                  <p className="text-gray-800 leading-relaxed font-light">{ref.response}</p>
                  <div className={`mt-3 text-[10px] uppercase tracking-wider flex items-center gap-2 ${isMe ? 'text-primary/70' : 'text-secondary/60'}`}>
                    <span>{isMe ? 'You' : 'Partner'}</span>
                    <span>•</span>
                    <span>{new Date(ref.created_at).toLocaleDateString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
