import DestinationPage from "@/app/destination/[slug]/page";

// Explicitly export constants here so Next.js can detect them without re-export warnings
export const revalidate = 300;
export const runtime = "nodejs";

export default DestinationPage;
