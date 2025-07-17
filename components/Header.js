// components/Header.js
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { useRouter } from 'next/router';
import { supabase } from '../supabaseClient';

export default function Header() {
  const user = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="bg-white shadow p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        房产平台
      </Link>

      <nav className="space-x-4">
        <Link href="/">主页</Link>
        <Link href="/upload-property">上传房源</Link>
        <Link href="/favorites">我的收藏</Link>
        {user ? (
          <>
            <Link href="/my-profile">我的主页</Link>
            <button onClick={handleLogout} className="text-red-600">登出</button>
          </>
        ) : (
          <>
            <Link href="/login">登入</Link>
            <Link href="/register">注册</Link>
          </>
        )}
      </nav>
    </header>
  );
}
