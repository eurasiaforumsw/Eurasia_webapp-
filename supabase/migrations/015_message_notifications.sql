-- EFSW Message Notifications System
-- Adds unread message tracking and notification features to the messaging system

-- 1. Add unread_count column to conversations table
-- This denormalized field improves query performance for conversation lists
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS unread_count integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.conversations.unread_count IS 'Cached count of unread messages in this conversation. Updated by trigger.';

-- 2. Add read_at timestamp to messages table
-- Tracks when each message was read by the recipient
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read_at timestamptz;

COMMENT ON COLUMN public.messages.read_at IS 'Timestamp when message was marked as read by recipient. NULL means unread.';

CREATE INDEX IF NOT EXISTS idx_messages_read_status ON public.messages (conversation_id, read_at) 
WHERE read_at IS NULL AND deleted_at IS NULL;

COMMENT ON INDEX idx_messages_read_status IS 'Performance index for finding unread messages per conversation';

-- 3. Function to calculate unread message count for a specific participant
-- This function counts messages sent by others that haven't been read yet
CREATE OR REPLACE FUNCTION calculate_unread_count(
  p_conversation_id text,
  p_member_id text
)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  -- Count messages in this conversation that:
  -- 1. Were NOT sent by this member
  -- 2. Have NOT been read (read_at IS NULL)
  -- 3. Are NOT deleted
  -- 4. Were sent after participant joined
  SELECT COUNT(*)::integer INTO v_count
  FROM public.messages m
  INNER JOIN public.conversation_participants cp 
    ON cp.conversation_id = m.conversation_id 
    AND cp.member_id = p_member_id
  WHERE m.conversation_id = p_conversation_id
    AND m.sender_id != p_member_id
    AND m.read_at IS NULL
    AND m.deleted_at IS NULL
    AND m.created_at >= cp.joined_at;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_unread_count IS 'Calculates unread message count for a specific participant in a conversation';

-- 4. Function to update unread_count when a message is inserted
-- Increments the cached unread count for all participants except the sender
CREATE OR REPLACE FUNCTION update_unread_count_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment unread_count for all participants in this conversation
  -- EXCEPT the sender (they don't need notification of their own message)
  UPDATE public.conversations
  SET unread_count = unread_count + 1
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_unread_count_on_insert IS 'Trigger function that increments unread_count when new message arrives';

-- 5. Trigger to automatically update unread_count on message insert
CREATE TRIGGER trigger_update_unread_count_on_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NULL)
  EXECUTE FUNCTION update_unread_count_on_insert();

COMMENT ON TRIGGER trigger_update_unread_count_on_insert ON public.messages IS 'Maintains unread_count cache when messages are created';

-- 6. Function to decrement unread_count when message is marked as read
CREATE OR REPLACE FUNCTION update_unread_count_on_read()
RETURNS TRIGGER AS $$
BEGIN
  -- When a message is marked as read (read_at changes from NULL to a timestamp)
  -- Decrement the unread_count for the conversation
  IF OLD.read_at IS NULL AND NEW.read_at IS NOT NULL THEN
    UPDATE public.conversations
    SET unread_count = GREATEST(0, unread_count - 1)
    WHERE id = NEW.conversation_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_unread_count_on_read IS 'Trigger function that decrements unread_count when message is marked read';

-- 7. Trigger for updating unread_count when message is read
CREATE TRIGGER trigger_update_unread_count_on_read
  AFTER UPDATE OF read_at ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_unread_count_on_read();

COMMENT ON TRIGGER trigger_update_unread_count_on_read ON public.messages IS 'Maintains unread_count cache when messages are marked as read';

-- 8. Function to mark all messages in a conversation as read
-- This is called when a user opens/views a conversation
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id text,
  p_member_id text
)
RETURNS integer AS $$
DECLARE
  v_updated_count integer;
BEGIN
  -- Mark all unread messages as read for this member
  WITH updated AS (
    UPDATE public.messages
    SET read_at = now()
    WHERE conversation_id = p_conversation_id
      AND sender_id != p_member_id
      AND read_at IS NULL
      AND deleted_at IS NULL
    RETURNING id
  )
  SELECT COUNT(*)::integer INTO v_updated_count FROM updated;
  
  -- Reset unread_count to 0 for this conversation
  UPDATE public.conversations
  SET unread_count = 0
  WHERE id = p_conversation_id;
  
  -- Update participant's last_read_at timestamp
  UPDATE public.conversation_participants
  SET last_read_at = now()
  WHERE conversation_id = p_conversation_id
    AND member_id = p_member_id;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mark_conversation_as_read IS 'Marks all unread messages in a conversation as read for a specific member. Returns count of messages marked.';

-- 9. Function to get unread conversations count for a member
-- Returns total number of conversations with unread messages
CREATE OR REPLACE FUNCTION get_unread_conversations_count(p_member_id text)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(DISTINCT c.id)::integer INTO v_count
  FROM public.conversations c
  INNER JOIN public.conversation_participants cp 
    ON cp.conversation_id = c.id
  INNER JOIN public.messages m 
    ON m.conversation_id = c.id
  WHERE cp.member_id = p_member_id
    AND m.sender_id != p_member_id
    AND m.read_at IS NULL
    AND m.deleted_at IS NULL
    AND m.created_at >= cp.joined_at;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unread_conversations_count IS 'Returns count of conversations with unread messages for a member';

-- 10. Index for performance optimization on conversation queries
CREATE INDEX IF NOT EXISTS idx_conversations_unread_count ON public.conversations (unread_count)
WHERE unread_count > 0;

COMMENT ON INDEX idx_conversations_unread_count IS 'Performance index for filtering conversations with unread messages';

-- 11. Add index on conversation_participants for notification queries
CREATE INDEX IF NOT EXISTS idx_participants_last_read ON public.conversation_participants (member_id, last_read_at DESC);

COMMENT ON INDEX idx_participants_last_read IS 'Performance index for participant read status queries';

-- 12. Function to recalculate and fix unread_count for all conversations
-- Useful for data repair or initial migration
CREATE OR REPLACE FUNCTION recalculate_all_unread_counts()
RETURNS integer AS $$
DECLARE
  v_updated_count integer := 0;
  v_conv_record RECORD;
BEGIN
  -- For each conversation, recalculate the actual unread count
  FOR v_conv_record IN 
    SELECT DISTINCT c.id as conversation_id
    FROM public.conversations c
  LOOP
    -- Count unread messages in this conversation
    WITH unread_counts AS (
      SELECT COUNT(*)::integer as unread
      FROM public.messages m
      WHERE m.conversation_id = v_conv_record.conversation_id
        AND m.read_at IS NULL
        AND m.deleted_at IS NULL
    )
    UPDATE public.conversations c
    SET unread_count = (SELECT unread FROM unread_counts)
    WHERE c.id = v_conv_record.conversation_id;
    
    v_updated_count := v_updated_count + 1;
  END LOOP;
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION recalculate_all_unread_counts IS 'Recalculates unread_count for all conversations. Use for data repair.';

-- Notes:
-- 1. unread_count is a denormalized field for performance - maintained by triggers
-- 2. read_at timestamp tracks when each individual message was read
-- 3. Use mark_conversation_as_read() when user opens a conversation
-- 4. Use get_unread_conversations_count() to show notification badge count
-- 5. Indexes optimize queries for unread message filtering
-- 6. recalculate_all_unread_counts() available for data consistency checks
