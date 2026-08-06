import { redirect } from "next/navigation";

/** Tickets module — same data as enquiries, focused on confirmed tickets. */
export default async function AdminTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();
  qs.set("status", params.status ?? "confirmed");
  if (params.q) qs.set("q", params.q);
  redirect(`/admin/enquiries?${qs.toString()}`);
}
