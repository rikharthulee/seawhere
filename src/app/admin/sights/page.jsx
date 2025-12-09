import SightsManager from "@/components/admin/SightsManager";

export default function AdminSightsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-medium">Manage Sights</h1>
      <div className="mt-6">
        <SightsManager />
      </div>
    </main>
  );
}
