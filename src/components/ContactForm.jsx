"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

const schema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(6, "Enter a valid phone number"),
  message: z.string().min(10, "Tell us a bit more (10+ chars)"),
  company: z.string().optional(),
});

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "", message: "", company: "" },
    mode: "onSubmit",
  });

  async function onSubmit(values) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phone: values.phone,
          message: values.message,
          hp: values.company || "", // simple honeypot field
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(json?.error || `Request failed (${res.status})`);
      setSubmitted(true);
      form.reset();
    } catch (e) {
      setError(e?.message || "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      {submitted ? (
        <Card>
          <CardContent className="p-4">
            <p className="text-green-700">
              Thank you for your enquiry - We will get back to you as soon as
              possible.
            </p>
          </CardContent>
        </Card>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Form {...form}>
      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Honeypot field (hidden) */}
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" {...field} />
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input type="text" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <Button type="submit" disabled={loading} className="rounded-full px-6">
            {loading ? "Sending…" : "Submit"}
          </Button>
        </div>
      </form>
      </Form>
    </div>
  );
}
