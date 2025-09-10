"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      // Let the browser show native validation messages
      form.reportValidity();
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = Object.fromEntries(new FormData(form));
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          hp: data.company || "", // simple honeypot field
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
        <div className="rounded-lg border border-black/10 p-4 bg-white">
          <p className="text-green-700">
            Thank you for your enquiry - We will get back to you as soon as
            possible.
          </p>
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <form noValidate onSubmit={onSubmit} className="space-y-5">
        {/* Honeypot field (hidden) */}
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-gray-700"
          >
            Phone Number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <label
            htmlFor="message"
            className="block text-sm font-medium text-gray-700"
          >
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="mt-1 w-full rounded-md border border-black/10 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-black text-white px-6 py-3 hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? "Sending…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
