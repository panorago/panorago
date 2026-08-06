import { getAdminPlaces } from "@/lib/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function toCsv(rows: Record<string, string>[]) {
  if (rows.length === 0) return "name\n";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((h) => csvEscape(String(row[h] ?? ""))).join(","),
    ),
  ];
  return lines.join("\n");
}

/** Excel-friendly SpreadsheetML (opens in Excel without xlsx dependency). */
function toSpreadsheetMl(rows: Record<string, string>[]) {
  const headers = rows.length > 0 ? Object.keys(rows[0]!) : ["name"];
  const cell = (v: string) =>
    `<Cell><Data ss:Type="String">${v
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")}</Data></Cell>`;
  const headerRow = `<Row>${headers.map(cell).join("")}</Row>`;
  const body = rows
    .map(
      (row) =>
        `<Row>${headers.map((h) => cell(String(row[h] ?? ""))).join("")}</Row>`,
    )
    .join("");
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Places">
  <Table>
   ${headerRow}
   ${body}
  </Table>
 </Worksheet>
</Workbook>`;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") ?? "csv").toLowerCase();

  const places = await getAdminPlaces();
  const rows = places.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    city: p.city,
    category: p.category,
    published: String(p.published),
    verified: String(p.verified),
    featured: String(!!p.featured),
    archived: String(!!p.archived),
    paid_tier: p.paidTier ?? "basic",
    price_guide: p.priceGuide,
    latitude: p.latitude != null ? String(p.latitude) : "",
    longitude: p.longitude != null ? String(p.longitude) : "",
    hero_image: p.heroImage,
  }));

  if (format === "xlsx" || format === "xls" || format === "excel") {
    const xml = toSpreadsheetMl(rows);
    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.ms-excel",
        "Content-Disposition":
          'attachment; filename="panora-places.xls"',
      },
    });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="panora-places.csv"',
    },
  });
}
