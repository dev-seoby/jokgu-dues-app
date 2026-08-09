import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 클라이언트
 *
 * 총무 1인(+ 유지보수용 관리자 1인) 전용 단일 테넌트 구조라
 * anon/publishable key를 그대로 클라이언트에 노출해도 안전함 —
 * 실제 데이터 접근은 DB의 RLS 정책("로그인한 사용자만")이 막아줌.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase 환경변수가 설정되지 않았습니다. .env 파일에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 설정해주세요.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
