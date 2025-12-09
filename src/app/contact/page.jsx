import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">Contact</h1>
      </div>

      <ContactForm />
    </main>
  );
}
