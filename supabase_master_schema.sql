-- MASTER SCHEMA FOR ZINZONE
-- (This will drop existing tables and recreate them cleanly)

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS reflections CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS plans CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Stores Usernames, Avatars, and Location)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    last_location_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Relationships Table
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) NOT NULL,
    user2_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own relationships" ON relationships FOR SELECT USING (auth.uid() = user1_id OR auth.uid() = user2_id);
CREATE POLICY "Users can insert relationships" ON relationships FOR INSERT WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- 3. Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their relationship" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = messages.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert messages in their relationship" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM relationships r WHERE r.id = messages.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())) AND sender_id = auth.uid());

-- 4. Memories Table (Posts)
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memories in their relationship" ON memories FOR SELECT USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = memories.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert memories in their relationship" ON memories FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM relationships r WHERE r.id = memories.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())) AND user_id = auth.uid());

-- 5. Reflections Table
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reflections in their relationship" ON reflections FOR SELECT USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = reflections.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert reflections in their relationship" ON reflections FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM relationships r WHERE r.id = reflections.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())) AND user_id = auth.uid());

-- 6. Plans Table
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view plans in their relationship" ON plans FOR SELECT USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = plans.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert plans in their relationship" ON plans FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM relationships r WHERE r.id = plans.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can update plans in their relationship" ON plans FOR UPDATE USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = plans.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can delete plans in their relationship" ON plans FOR DELETE USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = plans.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));

-- 7. Milestones Table
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones in their relationship" ON milestones FOR SELECT USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = milestones.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can insert milestones in their relationship" ON milestones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM relationships r WHERE r.id = milestones.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));
CREATE POLICY "Users can delete milestones in their relationship" ON milestones FOR DELETE USING (EXISTS (SELECT 1 FROM relationships r WHERE r.id = milestones.relationship_id AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())));

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE memories;
ALTER PUBLICATION supabase_realtime ADD TABLE plans;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- 8. Storage Setup
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads' AND auth.uid() = owner);
