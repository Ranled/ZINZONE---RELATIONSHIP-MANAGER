import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Image as ImageIcon, Send, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HomeTab() {
  const { user, profile, relationship } = useAuth();
  const [posts, setPosts] = useState([]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!relationship) return;
    fetchPosts();

    const subscription = supabase
      .channel('public:memories')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories', filter: `relationship_id=eq.${relationship.id}` }, (payload) => {
        // Fetch posts again to get user profiles attached, or just optimistic append
        fetchPosts();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [relationship]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('memories')
      .select('*, profiles(username, avatar_url)')
      .eq('relationship_id', relationship.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error("Fetch Posts Error:", error);
    } else if (data) {
      setPosts(data);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!description.trim() && !imageFile && !imageUrl.trim()) return;
    setLoading(true);

    let finalImageUrl = imageUrl;

    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, imageFile);

      if (!uploadError) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
        finalImageUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from('memories')
      .insert([
        {
          relationship_id: relationship.id,
          user_id: user.id,
          title: 'Post',
          description: description.trim(),
          image_url: finalImageUrl ? finalImageUrl.trim() : null
        }
      ]);

    if (!error) {
      setDescription('');
      setImageUrl('');
      setImageFile(null);
      fetchPosts();
    } else {
      console.error("Insert error:", error);
      alert("Failed to post: " + error.message);
    }
    setLoading(false);
  };

  const handleDeletePost = async (postId, imageUrl) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    // Delete from database
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error("Delete error:", error);
      alert("Failed to delete post: " + error.message);
    } else {
      // Optimistically remove from UI
      setPosts(current => current.filter(post => post.id !== postId));
      
      // Optionally delete image from storage if it exists and belongs to this post
      if (imageUrl && imageUrl.includes('uploads/posts/')) {
        try {
          const urlParts = imageUrl.split('uploads/posts/');
          if (urlParts.length > 1) {
            const fileName = urlParts[1];
            await supabase.storage.from('uploads').remove([`posts/${fileName}`]);
          }
        } catch (e) {
          console.error("Failed to delete image from storage", e);
        }
      }
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Create Post Area */}
      <div className="glass-card p-4 mx-2">
        <form onSubmit={handlePost} className="space-y-3">
          <div className="flex gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex-shrink-0 flex items-center justify-center text-primary font-bold">
              {profile?.username?.charAt(0).toUpperCase()}
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share a memory or update..."
              className="w-full bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none resize-none min-h-[40px] pt-2"
              rows={2}
            />
          </div>
          
          {imageUrl && (
            <div className="relative rounded-xl overflow-hidden mt-2 border border-gray-200">
              <img src={imageUrl} alt="Preview" className="w-full h-auto max-h-48 object-cover" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-1 mr-4">
              <label className="cursor-pointer flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
                <ImageIcon className="w-5 h-5" />
                <span>Add Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="submit"
              disabled={loading || (!description.trim() && !imageUrl.trim())}
              className="bg-primary hover:bg-primary/90 text-white rounded-full p-2 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div className="space-y-4 px-2">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-secondary/60">
            <p>No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={post.id}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center text-primary font-bold overflow-hidden">
                      {post.profiles?.avatar_url ? (
                        <img src={post.profiles.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                      ) : (
                        post.profiles?.username?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">@{post.profiles?.username || 'Unknown'}</p>
                      <p className="text-[10px] text-secondary/60 uppercase">
                        {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                </div>
                {post.user_id === user.id && (
                  <button 
                    onClick={() => handleDeletePost(post.id, post.image_url)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Post Content */}
              {post.description && (
                <div className="px-4 pb-3">
                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{post.description}</p>
                </div>
              )}

              {/* Post Image */}
              {post.image_url && (
                <div className="w-full bg-gray-100 border-t border-gray-100">
                  <img
                    src={post.image_url}
                    alt="Post content"
                    className="w-full h-auto max-h-96 object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
