-- Enable the UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: relationships
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) NOT NULL,
    user2_id UUID REFERENCES auth.users(id),
    invite_code TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own relationships"
    ON relationships FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can insert relationships"
    ON relationships FOR INSERT
    WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update relationships"
    ON relationships FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);


-- Table: messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their relationship"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = messages.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert messages in their relationship"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = messages.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
        AND sender_id = auth.uid()
    );


-- Table: memories
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memories in their relationship"
    ON memories FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = memories.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert memories in their relationship"
    ON memories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = memories.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
    );


-- Table: reflections
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID REFERENCES relationships(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reflections in their relationship"
    ON reflections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = reflections.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
    );

CREATE POLICY "Users can insert reflections in their relationship"
    ON reflections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = reflections.relationship_id
            AND (r.user1_id = auth.uid() OR r.user2_id = auth.uid())
        )
        AND user_id = auth.uid()
    );

-- Enable Realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
