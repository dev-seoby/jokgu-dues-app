import { useState } from "react";
import { ActionButton, Text, TextField, VStack } from "@seed-design/react";
import { useAuth } from "../hooks/useAuth";
import "./Login.css";

/**
 * 로그인 화면
 *
 * 회원가입 UI는 의도적으로 없음 — 총무/사장님 계정만 Supabase 대시보드에서
 * 미리 만들어두는 구조라, 이 화면은 로그인만 처리하면 됨.
 */
export function Login() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <VStack gap="x1">
          <Text as="p" textStyle="t2Bold" color="fg.brand" className="login-eyebrow">
            하루FC 회비관리
          </Text>
          <Text as="h1" textStyle="t7Bold" color="fg.neutral">
            로그인
          </Text>
          <Text textStyle="t3Regular" color="fg.neutralMuted">
            총무 전용 대시보드입니다
          </Text>
        </VStack>

        <VStack gap="x2" className="login-fields">
          <VStack gap="x1_5">
            <Text textStyle="t2Bold" color="fg.neutralMuted">
              이메일
            </Text>
            <TextField.Root className="login-textfield">
              <TextField.Input
                aria-label="이메일"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </TextField.Root>
          </VStack>

          <VStack gap="x1_5">
            <Text textStyle="t2Bold" color="fg.neutralMuted">
              비밀번호
            </Text>
            <TextField.Root className="login-textfield">
              <TextField.Input
                aria-label="비밀번호"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </TextField.Root>
          </VStack>

          {error && (
            <Text textStyle="t2Medium" color="fg.critical">
              {error}
            </Text>
          )}
        </VStack>

        <ActionButton type="submit" size="large" variant="brandSolid" disabled={!canSubmit} flexGrow>
          {isSubmitting ? "로그인 중..." : "로그인"}
        </ActionButton>
      </form>
    </div>
  );
}
