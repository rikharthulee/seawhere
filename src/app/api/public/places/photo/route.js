import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 0;

export async function GET(request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_MAPS_API_KEY is not set" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const photoName = searchParams.get("photoName");
  if (!photoName) {
    return NextResponse.json({ error: "photoName is required" }, { status: 400 });
  }
  const maxWidthPx = searchParams.get("maxWidthPx") || "1600";
  const maxHeightPx = searchParams.get("maxHeightPx") || "1200";

  const normalizedPhotoName = String(photoName || "").replace(/^\/+/, "");
  const url = new URL(
    `https://places.googleapis.com/v1/${encodeURI(normalizedPhotoName)}/media`
  );
  url.searchParams.set("maxWidthPx", maxWidthPx);
  url.searchParams.set("maxHeightPx", maxHeightPx);

  const res = await fetch(url.toString(), {
    headers: { "X-Goog-Api-Key": apiKey },
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (location) {
    return NextResponse.redirect(location, { status: 302 });
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return NextResponse.json(
      { error: text || `Failed to fetch photo (${res.status})` },
      { status: 500 }
    );
  }

  return new NextResponse(res.body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") || "image/jpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
