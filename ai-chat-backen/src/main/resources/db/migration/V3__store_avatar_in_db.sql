-- Migrate avatar storage from filesystem path to binary blob in the database.
-- Drop the old path column and add binary data + content-type columns.

ALTER TABLE users
    DROP COLUMN IF EXISTS profile_picture_path,
    ADD COLUMN avatar_data         BYTEA,
    ADD COLUMN avatar_content_type VARCHAR(50);
