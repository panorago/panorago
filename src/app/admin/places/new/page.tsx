import { PlaceForm } from "@/components/admin/place-form";
import { createPlace } from "@/lib/admin/actions";

export const metadata = {
  title: "Admin · Add place",
};

export default function AdminNewPlacePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Add place</h1>
        <p className="mt-1 text-sm text-muted">
          Create a new listing in Supabase. Unpublished places stay in draft.
        </p>
      </div>
      <PlaceForm action={createPlace} submitLabel="Create place" />
    </div>
  );
}
