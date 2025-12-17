import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What is Seawhere?",
    answer:
      "Seawhere is a curated planning platform for Southeast Asia. Browse destinations, day itineraries, accommodation and food picks, then tailor a trip with our admin tools and helpdesk support.",
  },
  {
    question: "Who is behind Seawhere?",
    answer:
      "Seawhere is run by a small team of travel specialists and technologists based in Southeast Asia, combining on-the-ground research with product expertise to build a better planning experience.",
  },
  {
    question: "Which countries are covered?",
    answer:
      "The first release focuses on Thailand, Laos, Vietnam and Cambodia, with Malaysia and Indonesia following shortly. Coverage expands continually as new content is published.",
  },
  {
    question: "How does booking work?",
    answer:
      "Seawhere curates trusted partners and links you directly to them. Payments are handled by the providers; we never store card details and you remain in control of every booking.",
  },
  {
    question: "How is my privacy protected?",
    answer:
      "Your personal information is handled with strict confidentiality and never shared without consent. Authentication is powered by Supabase; sensitive data is kept server-side.",
  },
  {
    question: "Do you take commission?",
    answer:
      "Some partner links include affiliate commission at no extra cost to you. Editorial choices are independent and based on traveller experience.",
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">FAQ</h1>
      </div>

      <section className="mt-8">
        <Accordion type="single" collapsible>
          {faqItems.map(({ question, answer }, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{question}</AccordionTrigger>
              <AccordionContent>
                <div dangerouslySetInnerHTML={{ __html: answer }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </main>
  );
}
