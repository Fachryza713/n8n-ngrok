-- Add image_url column to messages table if it doesn't exist
alter table messages 
add column if not exists image_url text;

-- (Optional) If you want to store file type strictly, you could add:
-- add column file_type text;
-- But image_url is enough for now.
