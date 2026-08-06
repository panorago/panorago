import { EnquiryForm } from "@/components/place/enquiry-form";
import { Reveal } from "@/components/motion/reveal";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Enquiry",
  description:
    "Enquire with Panora Go — WhatsApp, email, or call to plan your next unforgettable place in Zimbabwe.",
};

export default async function EnquiryPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const params = await searchParams;
  const placeName = params.place?.trim() ?? "";

  return (
    <div className="gradient-mesh pt-[calc(var(--nav-height)+2rem)]">
      <div className="container-panora pb-[var(--space-section)]">
        <Reveal className="mx-auto max-w-xl">
          <EnquiryForm initialPlaceName={placeName} />
        </Reveal>
      </div>
    </div>
  );
}
