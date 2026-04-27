import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Heart, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        if (!username.trim()) throw new Error("Username is required");
        
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Wait for session to be established if email confirmation is OFF
        if (authData?.user) {
          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([{ id: authData.user.id, username: username.trim() }]);
            
          if (profileError) {
             console.error("Failed to create profile:", profileError);
             // We won't block login if profile fails, but it shouldn't
          }
        }

        // Automatically sign in after sign up since email confirmation is off
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Please turn OFF 'Confirm email' in your Supabase Auth settings to use usernames!");
      } else {
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      alert("Please enter your email address first.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/login',
    });
    if (error) {
      alert(error.message);
    } else {
      alert("Password reset instructions have been sent to your email!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md glass-card p-8 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-accent animate-pulse" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-white text-glow tracking-tight">ZinZone</h1>
          <p className="text-secondary mt-2 text-center text-sm">Your private, shared space.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none input-glow transition-all mb-4"
                placeholder="Choose a unique username"
                required={isSignUp}
              />
            </motion.div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none input-glow transition-all"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none input-glow transition-all pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isSignUp && (
            <div className="flex justify-end mt-1">
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-secondary hover:text-white transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white rounded-xl px-4 py-3 font-medium transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/25 disabled:opacity-50 disabled:pointer-events-none mt-4"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-secondary hover:text-white transition-colors"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
