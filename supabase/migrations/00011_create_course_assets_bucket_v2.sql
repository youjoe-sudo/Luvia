-- إنشاء bucket للأصول العامة للكورسات (اللوجوهات، الصور، إلخ)
-- Create bucket for course assets (logos, images, etc.)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-assets',
  'course-assets',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- حذف السياسات القديمة إن وجدت
-- Drop old policies if they exist
DROP POLICY IF EXISTS "Public read access for course assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload course assets" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course assets" ON storage.objects;

-- سياسات التخزين
-- Storage policies

-- السماح للجميع بقراءة الملفات
-- Allow everyone to read files
CREATE POLICY "Public read access for course assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'course-assets');

-- السماح للمدراء فقط برفع الملفات
-- Allow only admins to upload files
CREATE POLICY "Admins can upload course assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-assets' 
  AND is_admin(auth.uid())
);

-- السماح للمدراء فقط بحذف الملفات
-- Allow only admins to delete files
CREATE POLICY "Admins can delete course assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-assets' 
  AND is_admin(auth.uid())
);