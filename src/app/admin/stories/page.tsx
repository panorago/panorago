import { StoryModerationList } from "@/components/admin/story-moderation-list";
import { getAdminStories } from "@/lib/admin/actions";

export const metadata = {
  title: "Command Center · The Story Continues",
};

export default async function AdminStoriesPage() {
  const stories = await getAdminStories();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
          Community
        </p>
        <h1 className="mt-1 font-display text-4xl">The Story Continues</h1>
        <p className="mt-2 text-sm text-muted">
          Hide, pin, or delete guest comments. Changes show on the place page
          immediately.
        </p>
      </div>
      <StoryModerationList stories={stories} />
    </div>
  );
}
