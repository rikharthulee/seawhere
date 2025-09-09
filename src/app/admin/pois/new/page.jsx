"use client";
import { useRouter } from "next/navigation";
import POIForm from "@/components/admin/POIForm";

export default function NewPOIPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl md:text-4xl font-medium flex-1">New POI</h1>
        </div>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-6">
        <POIForm
          onSaved={() => {
            router.replace("/admin");
            router.refresh();
          }}
          onCancel={() => router.back()}
        />
      </div>
    </main>
  );
}

