"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Article } from "@/lib/types";
import { deleteAction, draftAction, publishAction } from "./actions";

const PLATFORMS = ["知乎", "X (Twitter)", "위챗 공식계정", "블로그", "뉴스레터", "기타"];
const input = "w-full rounded-lg bg-card px-3 py-2 text-sm outline-none ring-1 ring-line focus:ring-accent";
const label = "mb-1 block text-xs font-medium text-muted";
const button = "rounded-full px-4 py-2 text-sm font-medium disabled:opacity-50";

export function CurateForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [author, setAuthor] = useState("");
  const [titleOriginal, setTitleOriginal] = useState("");
  const [text, setText] = useState("");
  const [titleKo, setTitleKo] = useState("");
  const [summaryKo, setSummaryKo] = useState("");
  const [quote, setQuote] = useState("");
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [drafting, startDraft] = useTransition();
  const [publishing, startPublish] = useTransition();

  function draft() {
    setMessage(null);
    startDraft(async () => {
      const res = await draftAction({ text, platform, author });
      if (!res.ok) return setMessage({ kind: "error", text: res.error });
      setTitleKo(res.data.titleKo);
      setSummaryKo(res.data.summaryKo);
      setMessage({ kind: "ok", text: "초안을 채웠습니다. 읽어보고 고쳐서 게시하세요." });
    });
  }

  function publish() {
    setMessage(null);
    startPublish(async () => {
      const res = await publishAction({ url, sourceLabel: platform, author, titleOriginal, titleKo, summaryKo, comment, quote });
      if (!res.ok) return setMessage({ kind: "error", text: res.error });
      setUrl("");
      setAuthor("");
      setTitleOriginal("");
      setText("");
      setTitleKo("");
      setSummaryKo("");
      setQuote("");
      setComment("");
      setMessage({ kind: "ok", text: "게시했습니다." });
      router.refresh();
    });
  }

  return (
    <section className="space-y-4 rounded-xl bg-card p-5">
      <h2 className="text-lg font-bold">큐레이션 글 올리기</h2>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted">
        <li>공개되는 것은 아래 한국어 제목·요약·코멘트·인용·출처뿐입니다. 붙여넣은 원문은 AI 초안에만 쓰고 저장하지 않습니다.</li>
        <li>좋은 글이어도 원문을 통째로 번역하거나, 문단마다 표현만 바꿔 옮기지 마세요. 요약은 핵심 아이디어만 본인 말로, 인용은 한두 문장까지만.</li>
        <li>로그인만 하면 누구나 볼 수 있는 글은 괜찮습니다. 비공개 계정, 회원 전용 그룹, 유료 구독 글은 올리지 마세요.</li>
        <li>전문 번역이나 더 긴 인용을 원하면 작성자에게 먼저 허락을 받으세요. 위챗의 원창(原创) 표시 글은 전재에 작성자 허가가 필요합니다.</li>
      </ul>

      <div>
        <label className={label}>원문 링크</label>
        <input className={input} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>출처(플랫폼)</label>
          <select className={input} value={platform} onChange={(e) => setPlatform(e.target.value)}>
            {PLATFORMS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>작성자</label>
          <input className={input} value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="이름 또는 계정" />
        </div>
      </div>
      <div>
        <label className={label}>원문 제목 (선택, 카드에 작게 표시)</label>
        <input className={input} value={titleOriginal} onChange={(e) => setTitleOriginal(e.target.value)} />
      </div>

      <div>
        <label className={label}>원문 붙여넣기 (AI 초안 전용, 저장·공개 안 됨)</label>
        <textarea className={`${input} h-40`} value={text} onChange={(e) => setText(e.target.value)} />
        <button
          type="button"
          onClick={draft}
          disabled={drafting || !text.trim()}
          className={`${button} mt-2 bg-card text-accent ring-1 ring-accent`}
        >
          {drafting ? "만드는 중…" : "AI 초안 만들기"}
        </button>
      </div>

      <div>
        <label className={label}>한국어 제목</label>
        <input className={input} value={titleKo} onChange={(e) => setTitleKo(e.target.value)} />
      </div>
      <div>
        <label className={label}>요약 (본인 말로, 2~4문장)</label>
        <textarea className={`${input} h-28`} value={summaryKo} onChange={(e) => setSummaryKo(e.target.value)} />
      </div>
      <div>
        <label className={label}>인용 (선택, 한두 문장)</label>
        <textarea className={`${input} h-16`} value={quote} onChange={(e) => setQuote(e.target.value)} />
      </div>
      <div>
        <label className={label}>내 코멘트</label>
        <textarea className={`${input} h-24`} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={publish}
          disabled={publishing || !url.trim() || !titleKo.trim()}
          className={`${button} bg-accent text-background`}
        >
          {publishing ? "게시 중…" : "게시"}
        </button>
        {message && <p className={`text-sm ${message.kind === "error" ? "text-red-600" : "text-muted"}`}>{message.text}</p>}
      </div>
    </section>
  );
}

export function CuratedList({ posts }: { posts: Article[] }) {
  const router = useRouter();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function remove(id: string) {
    setError(null);
    start(async () => {
      const res = await deleteAction(id);
      if (!res.ok) return setError(res.error);
      setConfirmId(null);
      router.refresh();
    });
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold">올린 글 ({posts.length})</h2>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {posts.length === 0 && <p className="text-sm text-muted">아직 없습니다.</p>}
      <ul className="space-y-2">
        {posts.map((p) => (
          <li key={p.id} className="flex items-start justify-between gap-3 rounded-xl bg-card p-4">
            <div className="min-w-0 text-sm">
              <p className="font-medium">{p.titleKo}</p>
              <p className="mt-0.5 truncate text-xs text-muted">
                {[p.sourceLabel, p.author].filter(Boolean).join(" · ")} · {p.url}
              </p>
            </div>
            {confirmId === p.id ? (
              <span className="flex shrink-0 gap-2 text-xs">
                <button type="button" disabled={pending} onClick={() => remove(p.id)} className="text-red-600">
                  정말 삭제
                </button>
                <button type="button" onClick={() => setConfirmId(null)} className="text-muted">
                  취소
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmId(p.id)} className="shrink-0 text-xs text-muted hover:text-red-600">
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
