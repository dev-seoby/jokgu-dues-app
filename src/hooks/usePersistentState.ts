import { useEffect, useRef, useState } from "react";

const STORAGE_PREFIX = "jokgu-dues-app:";

/**
 * localStorage에 값을 영구 저장하는 useState 대체 훅.
 *
 * - 최초 마운트 시 localStorage에 저장된 값이 있으면 그 값으로 초기화하고,
 *   없거나 파싱에 실패하면 defaultValue로 초기화 (실패 시 손상된 값은 자동 삭제)
 * - 이후 값이 바뀔 때마다 자동으로 localStorage에 다시 씀
 * - 브라우저(기기) 로컬 저장이라 기기 간 동기화는 안 됨. 여러 기기에서 접근하려면
 *   추후 서버(Supabase 등) 연동이 필요함 — 지금은 총무 1인, 단일 기기 사용을 가정.
 */
export function usePersistentState<T>(key: string, defaultValue: T) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  const isFirstRun = useRef(true);

  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      // 저장된 값이 손상된 경우 조용히 초기화하고 기본값으로 복구
      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // localStorage 자체를 못 쓰는 환경(프라이빗 모드 등)이면 무시
      }
      return defaultValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // 저장 실패(용량 초과 등)해도 앱이 죽지 않도록 무시 — 화면상 값은 정상 동작
    }
    isFirstRun.current = false;
  }, [storageKey, value]);

  return [value, setValue] as const;
}
