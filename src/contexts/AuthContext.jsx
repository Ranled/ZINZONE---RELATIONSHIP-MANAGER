import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [relationship, setRelationship] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRelationshipAndProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRelationshipAndProfile(session.user.id);
      } else {
        setRelationship(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRelationshipAndProfile = async (userId) => {
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileData) setProfile(profileData);

      // Fetch Relationship
      const { data: relData, error } = await supabase
        .from('relationships')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();
      
      if (!error && relData) {
        setRelationship(relData);
      } else {
        setRelationship(null);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRelationship = async () => {
    if (user) {
      await fetchRelationshipAndProfile(user.id);
    }
  }

  const value = {
    user,
    profile,
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
