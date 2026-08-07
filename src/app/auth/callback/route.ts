import { upsertExplorerProfile } from "@/lib/auth/profile";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data.user) {
        await upsertExplorerProfile(supabase, data.user);
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // fall through
    }
  }

  const joinUrl = new URL("/", origin);
  joinUrl.searchParams.set("join", "1");
  joinUrl.searchParams.set("next", next);
  return NextResponse.redirect(joinUrl.toString());
}
