-- Fix Foreign Keys so we can join tables with Profiles to get usernames/avatars

-- 1. Fix Memories Table
ALTER TABLE memories DROP CONSTRAINT IF EXISTS memories_user_id_fkey;
ALTER TABLE memories ADD CONSTRAINT memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Fix Messages Table
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Fix Plans Table
ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_user_id_fkey;
ALTER TABLE plans ADD CONSTRAINT plans_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 4. Fix Reflections Table
ALTER TABLE reflections DROP CONSTRAINT IF EXISTS reflections_user_id_fkey;
ALTER TABLE reflections ADD CONSTRAINT reflections_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
