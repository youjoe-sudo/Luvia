import { useEffect, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/db/supabase';
import type { Profile } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Ban, UserCheck, Shield } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useLanguage();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحميل المستخدمين', 'Failed to load users'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: t('تم التحديث', 'Updated'),
        description: t('تم تحديث دور المستخدم بنجاح', 'User role updated successfully'),
      });

      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحديث دور المستخدم', 'Failed to update user role'),
        variant: 'destructive',
      });
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('profiles')
        .update({ is_banned: isBanned })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: isBanned ? t('تم الحظر', 'Banned') : t('تم الإلغاء', 'Unbanned'),
        description: isBanned
          ? t('تم حظر المستخدم بنجاح', 'User banned successfully')
          : t('تم إلغاء حظر المستخدم بنجاح', 'User unbanned successfully'),
      });

      loadUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast({
        title: t('خطأ', 'Error'),
        description: t('فشل تحديث حالة المستخدم', 'Failed to update user status'),
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'instructor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return t('مدير', 'Admin');
      case 'instructor':
        return t('مدرس', 'Instructor');
      default:
        return t('طالب', 'Student');
    }
  };

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{t('إدارة المستخدمين', 'User Management')}</CardTitle>
              <CardDescription>
                {t('عرض وإدارة المستخدمين والأدوار', 'View and manage users and roles')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('البحث عن مستخدم...', 'Search for a user...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('إجمالي المستخدمين', 'Total Users')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('الطلاب', 'Students')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {users.filter((u) => u.role === 'student').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('المدرسون', 'Instructors')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {users.filter((u) => u.role === 'instructor').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('المديرون', 'Admins')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {users.filter((u) => u.role === 'admin').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="text-center py-8">{t('جاري التحميل...', 'Loading...')}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{t('لا توجد نتائج', 'No results found')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('الاسم', 'Name')}</TableHead>
                  <TableHead>{t('اسم المستخدم', 'Username')}</TableHead>
                  <TableHead>{t('البريد الإلكتروني', 'Email')}</TableHead>
                  <TableHead>{t('الدور', 'Role')}</TableHead>
                  <TableHead>{t('الحالة', 'Status')}</TableHead>
                  <TableHead className="text-right">{t('الإجراءات', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name || '-'}</TableCell>
                    <TableCell>{user.username || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.is_banned ? (
                        <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                          {t('محظور', 'Banned')}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                          {t('نشط', 'Active')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Change Role */}
                        <Select
                          value={user.role}
                          onValueChange={(value) => handleUpdateRole(user.id, value as any)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">{t('طالب', 'Student')}</SelectItem>
                            <SelectItem value="instructor">{t('مدرس', 'Instructor')}</SelectItem>
                            <SelectItem value="admin">{t('مدير', 'Admin')}</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Ban/Unban */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant={user.is_banned ? 'outline' : 'destructive'}
                              size="sm"
                            >
                              {user.is_banned ? (
                                <UserCheck className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                {user.is_banned
                                  ? t('إلغاء حظر المستخدم', 'Unban User')
                                  : t('حظر المستخدم', 'Ban User')}
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                {user.is_banned
                                  ? t(
                                      'هل أنت متأكد من إلغاء حظر هذا المستخدم؟',
                                      'Are you sure you want to unban this user?'
                                    )
                                  : t(
                                      'هل أنت متأكد من حظر هذا المستخدم؟ لن يتمكن من تسجيل الدخول.',
                                      'Are you sure you want to ban this user? They will not be able to log in.'
                                    )}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('إلغاء', 'Cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleBanUser(user.id, !user.is_banned)}
                              >
                                {user.is_banned ? t('إلغاء الحظر', 'Unban') : t('حظر', 'Ban')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
