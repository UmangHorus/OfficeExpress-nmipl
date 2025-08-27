"use client";
import LoginForm from "@/components/auth/LoginForm";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginStore } from "@/stores/auth.store";
import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useLoginStore();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get("from") || "/dashboard";
      router.replace(redirectTo);
    }
  }, [isAuthenticated, router, searchParams]);

  return <LoginForm />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}