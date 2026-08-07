type JsonLdProps = {
  // Schema.org graphs are intentionally loose; stringify at render time.
  data: object;
};

/** Safe JSON-LD script tag for Organization, Place, etc. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
