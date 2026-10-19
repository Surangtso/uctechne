import { redirect } from "next/navigation";

// Some browsers and link-preview crawlers always ask for /favicon.ico; point them at the generated icon.
export function GET() {
  redirect("/icon");
}
