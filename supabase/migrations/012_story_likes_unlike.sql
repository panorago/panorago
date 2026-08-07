-- Allow visitors to remove their own story likes (unlike).
-- Matches the open insert model on story_likes (visitor_key is client-supplied).

drop policy if exists "story_likes_public_delete_own" on public.story_likes;
create policy "story_likes_public_delete_own"
  on public.story_likes
  for delete
  to anon, authenticated
  using (true);
