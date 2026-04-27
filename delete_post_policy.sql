-- Add DELETE policy for memories (posts)
CREATE POLICY "Users can delete their own memories" 
ON memories FOR DELETE 
USING (user_id = auth.uid());
