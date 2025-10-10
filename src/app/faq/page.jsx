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
      "JapanMan is an innovative new way to plan your Japan holiday. Our site is packed with expertly curated ideas from tailored excursions and off-the-beaten track adventures to accommodation and restaurant picks. Members can choose from dozens of itinerary ideas then customise to their heart’s content, with JapanMan on hand to assist via our email helpdesk.",
  },
  {
    question: "Who is behind JapanMan?",
    answer:
      "We are a two-man team from the UK, currently based in South-East Asia. JapanMan combines David’s extensive experience as a Japan specialist at leading UK agencies with Richard’s technical expertise. You can check out our LinkedIn profiles here: <a href='https://www.linkedin.com/in/david-wall-linkedin' target='_blank' rel='noopener noreferrer'>David Wall</a> and <a href='https://www.linkedin.com/in/richard-lee-linkedin' target='_blank' rel='noopener noreferrer'>Richard Lee</a>.",
  },
  {
    question: "What’s included with the membership fee?",
    answer:
      "A flat fee of £50 gives you access to everything on our site. Hundreds of exclusive excursions, day trips, affiliate tours and experiences, curated accommodation selections and food & drink ideas. Dozens of suggested itineraries, a custom itinerary builder that can be calibrated to your flight dates, scheduling advice, booking links, comprehensive trip tips and email helpdesk support is all here.",
  },
  {
    question: "What areas does JapanMan cover?",
    answer:
      "We currently provide comprehensive coverage of central Japan from Tokyo up to the Japan Alps and over to Kanazawa on the north coast, then on to the western tip of Honshu via Kyoto, Osaka and Hiroshima. We go into depth in every key location and offer hundreds of things to do in Tokyo and Kyoto alone.",
  },
  {
    question: "Can JapanMan handle bookings?",
    answer:
      "JapanMan provides curated recommendations and booking links to various affiliates, but you make all payments directly with the service providers so you maintain full control.",
  },
  {
    question: "Does JapanMan make money from its affiliates?",
    answer:
      "Yes, JapanMan makes commission by linking out to a range of affiliate sites, but note that the price you pay is the same whether you go via our site or direct to the service provider. Our commission ranges from 3% to 16%.",
  },
  {
    question: "Is JapanMan suitable for all types of holidaymakers?",
    answer:
      "Yes, JapanMan draws on David’s experience arranging holidays from budget-conscious to super-luxury, to suit everyone from families to couples to groups of friends. We flag up experiences that are not suitable for children, but Japan generally is a safe family-friendly country apart from a few of the Soho-like adult areas.",
  },
  {
    question: "What is the itinerary builder?",
    answer:
      "The itinerary builder is an exclusive, interactive travel planning experience that sits at the heart of JapanMan’s service. Select from our range of suggested itineraries then add, swap out and choose from hundreds of custom excursions, experiences, accommodation and restaurants. Add your flight dates and the builder will flag up potential clashes such as the closing days of attractions, so you can rearrange as necessary. It even flags up when you may be trying to pack too much into one day. With JapanMan’s attention to the day-by-day details you can travel independently, or you can bounce out from the itinerary to book guides, group tours, experiences and tickets through our affiliates.",
  },
  {
    question: "How is my privacy protected?",
    answer:
      "Your personal information is handled with strict confidentiality and never shared without consent. Credit card information is handled by a third party payment platform so is not seen or stored by JapanMan. You provide personal information to our affiliates separately if you choose to book with them.",
  },
  {
    question: "Are there any plans for future features?",
    answer:
      "JapanMan is continuously adding new features and improving the holiday planning experience based on user feedback. We are also widening our coverage of Japan in stages so that Tohoku, Hokkaido, Shikoku, Kyushu and Okinawa will all be featured and the whole of Japan will be comprehensively represented.",
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
