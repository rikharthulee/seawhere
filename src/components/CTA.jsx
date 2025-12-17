import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function CTA() {
  return (
    <section id="plan" className="py-16">
      <div className="mx-auto max-w-6xl">
        <Card className="rounded-2xl bg-primary text-primary-foreground py-12">
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-medium">
                  Plan your tailor-made journey
                </h3>
                <p className="mt-2 text-primary-foreground/80">
                  Speak to a specialist to craft a trip around you.
                </p>
              </div>
              <div className="md:text-right">
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
