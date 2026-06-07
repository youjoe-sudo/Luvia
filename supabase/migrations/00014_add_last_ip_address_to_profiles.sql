-- إضافة حقل last_ip_address إلى جدول profiles
-- Add last_ip_address field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_ip_address TEXT;