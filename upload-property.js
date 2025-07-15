import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function UploadPage() {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push('/login');
    }
  }, [user]);

  if (!user) return <div>请先登录...</div>;

  return (
    <div>上传房产内容...</div>
  );
}
