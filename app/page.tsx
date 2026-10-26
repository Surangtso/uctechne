import Home from "./home";

export default function Page({ searchParams }: { searchParams: Parameters<typeof Home>[0]["searchParams"] }) {
  return <Home lang="ko" searchParams={searchParams} />;
}
