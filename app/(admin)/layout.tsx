import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/admin-login');
  }

  // Verify admin role
  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, role, is_active')
    .eq('auth_id', session.user.id)
    .single();

  if (error || !admin || !admin.is_active) {
    redirect('/admin-login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
      {children}
    </div>
  );
}
