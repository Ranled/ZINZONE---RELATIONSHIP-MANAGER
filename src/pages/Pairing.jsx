import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Link2, Copy, CheckCircle2, UserPlus, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Pairing() {
  const { user, refreshRelationship, signOut } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    // Generate a random 6 character alphanumeric code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setGeneratedCode(code);
  };

  const copyToClipboard = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCreateRelationship = async () => {
    if (!generatedCode) return;
    setLoading(true);
    setError(null);

    try {
      // First check if user is already in a relationship
      const { data: existing } = await supabase
        .from('relationships')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .single();

      if (existing) {
        await refreshRelationship();
        return;
      }

      const { error } = await supabase
        .from('relationships')
        .insert([
          { user1_id: user.id, invite_code: generatedCode }
        ]);

      if (error) throw error;
      
      // Keep polling or setup realtime subscription here to check if someone joined
      // For simplicity, we just refresh state so they wait.
      await refreshRelationship();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRelationship = async (e) => {
    e.preventDefault();
    if (!inviteCode) return;
    setLoading(true);
    setError(null);

    try {
      // Find the relationship with this code
      const { data: rel, error: fetchError } = await supabase
        .from('relationships')
        .select('*')
        .eq('invite_code', inviteCode.trim())
        .single();

      if (fetchError || !rel) {
        throw new Error("Invalid invite code or relationship not found.");
      }

      if (rel.user2_id) {
        throw new Error("This relationship is already full.");
      }

      if (rel.user1_id === user.id) {
        throw new Error("You cannot join your own generated code.");
      }

      // Update the relationship with user2_id
      const { error: updateError } = await supabase
        .from('relationships')
        .update({ user2_id: user.id })
        .eq('id', rel.id);

      if (updateError) throw updateError;

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
            <h2 className="text-2xl font-bold text-white text-glow">Connect</h2>
            <button onClick={signOut} className="text-secondary hover:text-white transition-colors" title="Sign Out">
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {/* Join existing */}
            <div>
              <h3 className="text-sm font-medium text-secondary mb-3 flex items-center gap-2 uppercase tracking-wider">
                <UserPlus className="w-4 h-4" /> Have an invite code?
              </h3>
              <form onSubmit={handleJoinRelationship} className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none input-glow transition-all uppercase tracking-widest font-mono"
                  maxLength={6}
                />
                <button
                  type="submit"
                  disabled={loading || !inviteCode}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6 font-medium transition-colors disabled:opacity-50"
                >
                  Join
                </button>
              </form>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-[#0F0F1A] text-secondary">OR</span>
              </div>
            </div>

            {/* Create new */}
            <div>
              <h3 className="text-sm font-medium text-secondary mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Link2 className="w-4 h-4" /> Start a new space
              </h3>
              
              {!generatedCode ? (
                <button
                  onClick={generateCode}
                  className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl py-3 font-medium transition-all"
                >
                  Generate Invite Code
                </button>
              ) : (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-white/5 border border-primary/30 rounded-xl p-4 flex items-center justify-between">
                    <span className="text-2xl font-mono tracking-widest text-white">{generatedCode}</span>
                    <button
                      onClick={copyToClipboard}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors text-secondary hover:text-white"
                    >
                      {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-secondary text-center">
                    Share this code with your partner. They will use it to join your space.
                  </p>
                  <button
                    onClick={handleCreateRelationship}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl py-3 font-medium transition-all shadow-lg shadow-primary/25 disabled:opacity-50"
                  >
                    {loading ? 'Initializing Space...' : 'I have shared the code'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
