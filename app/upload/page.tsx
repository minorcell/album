import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  redirect('/');
}
