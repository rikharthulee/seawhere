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
      "Seawhere is a curated planning platform for Southeast Asia. Browse destinations, excursions, accommodation and food picks, then tailor an itinerary with our admin tools and helpdesk support.",
  },
  {
    question: "Who is behind Seawhere?",
    answer:
      "We are a two-person team based in the region, pairing years of specialist travel planning with technical delivery. You can check out our LinkedIn profiles here: <a href='https://www.linkedin.com/in/david-wall-16a05441/' target='_blank' rel='noopener noreferrer'>David Wall</a> and <a href='https://www.linkedin.com/in/richard-lee-314aa333/' target='_blank' rel='noopener noreferrer'>Richard Lee</a>.",
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
      <div className="border-t-2 border-border pt-2">
        <h1 className="text-3xl md:text-4xl font-medium">FAQ</h1>
        <div className="border-b-2 border-border mt-3" />
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
