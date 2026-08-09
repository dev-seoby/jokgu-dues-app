import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabaseClient";

/**
 * Supabase Auth 세션 상태 훅
 *
 * 총무/사장님 계정만 미리 생성해둔 구조라 회원가입 화면은 따로 없고,
 * 이 훅은 로그인 여부(세션 유무)만 추적함. 세션은 supabase-js가
 * 알아서 localStorage에 저장/복원해주기 때문에 새로고침해도 로그인 유지됨.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, loading, isAuthenticated: !!session, signIn, signOut };
}
