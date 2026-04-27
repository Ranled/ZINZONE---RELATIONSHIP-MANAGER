import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MemoriesTab() {
  const { relationship } = useAuth();
  const [memories, setMemories] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    fetchMemories();
  }, [relationship]);

  const fetchMemories = async () => {
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('relationship_id', relationship.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setMemories(data);
    }
  };

  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!title.trim() || !relationship) return;
    setLoading(true);

    const { error } = await supabase
      .from('memories')
      .insert([
        {
          relationship_id: relationship.id,
          title: title.trim(),
          description: description.trim(),
          image_url: imageUrl.trim() || null
        }
      ]);

    if (!error) {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setIsAdding(false);
      fetchMemories();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-semibold text-gray-800">Shared Memories</h2>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-white hover:bg-gray-50 text-gray-900 rounded-full transition-colors"
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
            className="overflow-hidden"
          >
            <form onSubmit={handleAddMemory} className="glass-card p-5 space-y-4 mx-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Memory Title"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none input-glow transition-all"
                required
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What made this special?"
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none input-glow transition-all resize-none h-24"
              />
              <div className="flex gap-2 items-center bg-white border border-gray-200 rounded-xl px-4 py-2 focus-within:border-primary/50 transition-all">
                <ImageIcon className="w-5 h-5 text-secondary/70" />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL (Optional)"
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none py-1"
                />
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl px-6 py-2.5 font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Memory'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4 px-2">
        {memories.length === 0 && !isAdding ? (
          <div className="text-center py-12 text-secondary/60">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No memories yet. Add your first one!</p>
          </div>
        ) : (
          memories.map((memory, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              key={memory.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:bg-gray-50 transition-colors"
            >
              {memory.image_url && (
                <div className="w-full h-48 bg-gray-100 relative overflow-hidden group">
                  <img
                    src={memory.image_url}
                    alt={memory.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.target.style.display = 'none'; // hide broken images
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F1A] to-transparent opacity-60" />
                </div>
              )}
              <div className="p-5 relative">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">{memory.title}</h3>
                <span className="text-[10px] uppercase tracking-wider text-secondary/60 mb-3 block">
                  {new Date(memory.created_at).toLocaleDateString(undefined, {
                    year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </span>
                {memory.description && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {memory.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
