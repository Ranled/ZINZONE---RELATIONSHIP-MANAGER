import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Navigation, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MapTab() {
  const { user, profile, relationship } = useAuth();
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    
    // Determine partner ID
    const partnerId = relationship.user1_id === user.id ? relationship.user2_id : relationship.user1_id;
    
    // Fetch partner's profile
    const fetchPartner = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('username, avatar_url, latitude, longitude, last_location_update')
        .eq('id', partnerId)
        .single();
        
      if (data) setPartnerProfile(data);
      setLoading(false);
    };

    fetchPartner();

    // Subscribe to partner's location updates
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${partnerId}` }, (payload) => {
        setPartnerProfile(payload.new);
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [relationship, user.id]);

  const shareLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setSharing(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        const { error } = await supabase
          .from('profiles')
          .update({
            latitude,
            longitude,
            last_location_update: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          setError("Failed to update location in database.");
        }
        setSharing(false);
      },
      (err) => {
        setError("Unable to retrieve your location. Please allow location access.");
        setSharing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const MapIframe = ({ lat, lng, title }) => (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50 flex items-center justify-center">
      {lat && lng ? (
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02},${lat - 0.02},${lng + 0.02},${lat + 0.02}&layer=mapnik&marker=${lat},${lng}`}
          className="absolute inset-0"
        />
      ) : (
        <p className="text-gray-400 text-sm">Location not available</p>
      )}
    </div>
  );

  const formatTime = (isoString) => {
    if (!isoString) return 'Never';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col space-y-4 p-2 pb-6">
      
      {/* Share Button */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center justify-between shadow-sm">
        <div>
          <h2 className="font-semibold text-gray-900">Your Location</h2>
          <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3" /> Last updated: {formatTime(profile?.last_location_update)}
          </p>
        </div>
        <button
          onClick={shareLocation}
          disabled={sharing}
          className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Navigation className={`w-4 h-4 ${sharing ? 'animate-pulse' : ''}`} />
          {sharing ? 'Locating...' : 'Update'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        {/* User Map */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border border-primary/20">
              {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" /> : profile?.username?.charAt(0).toUpperCase()}
            </div>
            <span className="font-semibold text-gray-900">You</span>
          </div>
          <MapIframe lat={profile?.latitude} lng={profile?.longitude} />
        </motion.div>

        {/* Partner Map */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold overflow-hidden border border-accent/20">
                {partnerProfile?.avatar_url ? <img src={partnerProfile.avatar_url} className="w-full h-full object-cover" /> : partnerProfile?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <span className="font-semibold text-gray-900">@{partnerProfile?.username || 'Partner'}</span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {formatTime(partnerProfile?.last_location_update)}
            </p>
          </div>
          <MapIframe lat={partnerProfile?.latitude} lng={partnerProfile?.longitude} />
        </motion.div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-xl border border-red-100 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}
