import { Reveal } from "@/components/motion/reveal";
import type { ExperienceStory } from "@/types";

type PanoraCircleProps = {
  placeName: string;
  stories: ExperienceStory[];
  fullPlaceHref: string;
};

export function PanoraCircle({
  placeName,
  stories,
  fullPlaceHref,
}: PanoraCircleProps) {
  const published = stories.filter((s) => s.published).slice(0, 3);

  return (
    <Reveal>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
        Belong
      </p>
      <h2 className="mt-2 font-display text-3xl md:text-4xl">Panora Circle</h2>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Moments from travellers who found {placeName} — not star ratings, living
        stories.
      </p>

      {published.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {published.map((story) => (
            <li
              key={story.id}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--glass)] p-5 backdrop-blur-md"
            >
              <p className="long-form text-sm leading-relaxed">{story.body}</p>
              <p className="mt-3 text-xs font-medium text-[var(--accent)]">
                — {story.authorName}
                {story.feeling ? ` · ${story.feeling}` : ""}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--glass)] p-6 text-sm text-muted">
          <p>
            The Circle is waiting for its first chapter here. When you go, leave
            a moment — not a review.
          </p>
          <a
            href={fullPlaceHref}
            className="mt-3 inline-block text-sm font-semibold text-[var(--accent)] hover:underline"
          >
            Open the full place page to share yours →
          </a>
        </div>
      )}
    </Reveal>
  );
}
