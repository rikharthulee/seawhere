export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-black/10 pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">About JapanMan</h1>
        <div className="border-b-2 border-black/10 mt-3" />
      </div>

      <section className="mt-8 space-y-4 text-lg leading-relaxed">
        <p>
          I help travelers plan unforgettable trips to Japan with practical,
          well-paced itineraries that blend must-see highlights with local
          experiences. From Tokyo’s neon nights to Kyoto’s temple paths and
          beyond, I tailor recommendations to your interests, timing, and pace.
        </p>
        <p>
          Expect clear, step-by-step guidance, efficient routing, dining picks,
          and on-the-ground WhatsApp support if you want it. Whether it’s your
          first visit or your fifth, I’ll make sure your time is spent seeing
          more and stressing less.
        </p>
        <p className="text-gray-700">
          Ready to start planning? Reach out and I’ll propose a draft itinerary
          to get the ball rolling.
        </p>
      </section>
    </main>
  );
}
