import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is JapanMan?",
    answer:
      "JapanMan is a personalized travel planning service focused on creating tailored itineraries for your trip to Japan, ensuring a smooth and memorable experience.",
  },
  {
    question: "Who is behind JapanMan?",
    answer:
      "JapanMan is run by an experienced travel planner with deep knowledge of Japan, passionate about helping travelers explore the country authentically.",
  },
  {
    question: "What’s included in the planning service?",
    answer:
      "The service includes a draft itinerary based on your interests and dates, detailed maps, routing suggestions, and booking guidance.",
  },
  {
    question: "Can JapanMan handle bookings?",
    answer:
      "JapanMan provides curated recommendations and booking guidance, but you make all payments directly with providers to maintain full control.",
  },
  {
    question: "Why do I have to pay for planning?",
    answer:
      "The fee covers personalized planning time, expertise, and ongoing support to ensure your trip is well-organized and enjoyable.",
  },
  {
    question: "Do you offer travel advice?",
    answer:
      "Yes, you’ll receive practical advice tailored to your itinerary, including cultural tips, transportation options, and local insights.",
  },
  {
    question: "Is JapanMan suitable for families?",
    answer:
      "Absolutely. Itineraries are balanced to accommodate travel times, rest, and activities suitable for all ages.",
  },
  {
    question: "What is the itinerary builder?",
    answer:
      "The itinerary builder is a tool that helps visualize your trip day-by-day, making adjustments easy and clear.",
  },
  {
    question: "What areas does JapanMan cover?",
    answer:
      "JapanMan covers all major regions of Japan, including Tokyo, Kyoto, Osaka, Hokkaido, and more.",
  },
  {
    question: "What is the refund policy?",
    answer:
      "Refunds are handled on a case-by-case basis. Please contact us to discuss any concerns.",
  },
  {
    question: "How can I contact JapanMan?",
    answer:
      "You can reach out via the contact form on the website or email directly for inquiries and support.",
  },
  {
    question: "How is my privacy protected?",
    answer:
      "Your personal information is handled with strict confidentiality and never shared without consent.",
  },
  {
    question: "Are there plans for future features?",
    answer:
      "Yes, we are continuously working to add new features and improve the planning experience based on user feedback.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">FAQ</h1>
        <div className="border-b-2 border-border mt-3" />
      </div>

      <section className="mt-8">
        <Accordion type="single" collapsible>
          {faqItems.map(({ question, answer }, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
