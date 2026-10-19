import { Suspense } from "react";
import type { Metadata } from "next";
import { isAdmin } from "@/lib/admin";
import { listCurated } from "@/lib/store";
import { login, logout } from "./actions";
import { CurateForm, CuratedList } from "./curate-form";

export const metadata: Metadata = {
  title: "관리",
  robots: { index: false, follow: false },
};

export default function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <Suspense fallback={<p className="text-sm text-muted">불러오는 중…</p>}>
        <Content searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Content({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const { error } = await searchParams;
  if (!(await isAdmin())) {
    return (
      <form action={login} className="space-y-3 rounded-xl bg-card p-5">
        <h1 className="text-lg font-bold">관리 로그인</h1>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          className="w-full rounded-lg bg-background px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent"
        />
        {error && <p className="text-sm text-red-600">비밀번호가 맞지 않습니다.</p>}
        <button type="submit" className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-background">
          로그인
        </button>
      </form>
    );
  }

  const posts = await listCurated();
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">관리</h1>
        <form action={logout}>
          <button type="submit" className="text-sm text-muted hover:text-foreground">
            로그아웃
          </button>
        </form>
      </header>
      <CurateForm />
      <CuratedList posts={posts} />
    </>
  );
}
