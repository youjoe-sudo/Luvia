-- إضافة سياسة للسماح للمستخدمين المصادق عليهم بتحديث الأكواد عند التفعيل
-- Allow authenticated users to update vouchers when redeeming

-- حذف السياسة القديمة إن وجدت
DROP POLICY IF EXISTS "Users can redeem vouchers" ON vouchers;

-- إنشاء سياسة جديدة تسمح للمستخدمين بتحديث الأكواد غير المستخدمة فقط
-- Create new policy allowing users to update only unused vouchers
CREATE POLICY "Users can redeem vouchers" ON vouchers
  FOR UPDATE
  TO authenticated
  USING (
    -- يمكن تحديث الكود فقط إذا كان غير مستخدم
    -- Can only update if voucher is not used
    is_used = false
    AND (expiry_date IS NULL OR expiry_date > NOW())
  )
  WITH CHECK (
    -- التحقق من أن التحديث يقوم فقط بتعيين الكود كمستخدم
    -- Ensure update only marks voucher as used
    is_used = true
    AND used_by_user_id = auth.uid()
  );

-- التأكد من أن المستخدمين يمكنهم قراءة الأكواد للتحقق منها
-- Ensure users can read vouchers to validate them
DROP POLICY IF EXISTS "Users can view vouchers for validation" ON vouchers;

CREATE POLICY "Users can view vouchers for validation" ON vouchers
  FOR SELECT
  TO authenticated
  USING (true);