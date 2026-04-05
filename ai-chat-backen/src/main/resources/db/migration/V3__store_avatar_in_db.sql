-- PostgreSQL migration: switch avatar storage from filesystem path to DB columns.

ALTER TABLE users
    DROP COLUMN IF EXISTS profile_picture_path;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_data BYTEA;

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_content_type VARCHAR(50);
