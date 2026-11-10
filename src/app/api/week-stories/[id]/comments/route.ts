import { NextResponse } from "next/server";

import { getWeekStoryComments } from "@/lib/stories/week-stories";
import {
  assertSameOrigin,
  isRateLimited,
} from "@/lib/security/request-guards";
import { createServiceClient } from "@/lib/supabase/service";

function clean(value: string, max: number) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const comments = await getWeekStoryComments(id);
  return NextResponse.json({ comments });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Blocked." }, { status: 403 });
  }
  if (await isRateLimited(request, "week-story-comment", 8, 60_000)) {
    return NextResponse.json(
      { error: "Slow down a moment, then try again." },
      { status: 429 },
    );
  }

  const { id } = await context.params;
  let authorName = "";
  let body = "";
  let trap = "";
  try {
    const payload = (await request.json()) as {
      authorName?: unknown;
      body?: unknown;
      company?: unknown;
    };
    authorName = clean(typeof payload.authorName === "string" ? payload.authorName : "", 40);
    body = clean(typeof payload.body === "string" ? payload.body : "", 280);
    trap = typeof payload.company === "string" ? payload.company.trim() : "";
  } catch {
    return NextResponse.json({ error: "Invalid comment." }, { status: 400 });
  }

  if (trap) return NextResponse.json({ ok: true });
  if (authorName.length < 1 || body.length < 2) {
    return NextResponse.json(
      { error: "Add your name and a short comment." },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ error: "Comments are unavailable." }, { status: 503 });
  }

  const { data: story, error: storyError } = await supabase
    .from("week_stories")
    .select("id, published, expires_at")
    .eq("id", id)
    .maybeSingle();

  if (storyError) {
    if (/week_stories|schema cache/i.test(storyError.message)) {
      return NextResponse.json(
        { error: "Stories are not available yet." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Could not post that comment." }, { status: 400 });
  }

  const expired =
    story?.expires_at && Date.parse(story.expires_at as string) <= Date.now();
  if (!story?.published || expired) {
    return NextResponse.json({ error: "This status is not open for comments." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("week_story_comments")
    .insert({
      story_id: id,
      author_name: authorName,
      body,
    })
    .select("id, story_id, author_name, body, created_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Could not post that comment." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    comment: {
      id: data.id,
      storyId: data.story_id,
      authorName: data.author_name,
      body: data.body,
      createdAt: data.created_at,
    },
  });
}
