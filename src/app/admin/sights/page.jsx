import SightsManager from "@/components/admin/SightsManager";

export default function AdminSightsPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-4">
        <h1 className="text-3xl md:text-4xl font-medium">Sights</h1>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>
      <div className="mt-6">
        <SightsManager />
      </div>
    </main>
  );
}

