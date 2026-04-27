import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRelationship(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRelationship(session.user.id);
      } else {
        setRelationship(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRelationship = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();
      
      if (!error && data) {
        setRelationship(data);
      } else {
        setRelationship(null);
      }
    } catch (error) {
      console.error("Error fetching relationship:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRelationship = async () => {
    if (user) {
      await fetchRelationship(user.id);
    }
  }

  const value = {
    user,
    relationship,
    loading,
    refreshRelationship,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
