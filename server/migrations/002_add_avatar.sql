-- Migration: add avatar_url column to users
ALTER TABLE IF EXISTS users
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
