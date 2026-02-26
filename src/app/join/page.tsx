"use client";

import { useState } from "react";
import Link from "next/link";
import { EmployerSignupForm } from "@/components/EmployerSignupForm";
import { EmployerFooter } from "@/components/EmployerFooter";

const INDUSTRIES = [
  "Retail / Stocking",
  "Cashier",
  "Janitorial / Custodial",
  "Hospitality",
  "Food Service",
  "Warehouse / Logistics",
  "Landscaping",
  "Assembly / Manufacturing",
  "Office / Administrative",
  "Other",
];

export default function JoinPage() {
  const [success, setSuccess] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-jtsg-green text-white shadow">
        <div className="max-w-2xl mx-auto px-4 py-6 flex flex-wrap items-center gap-3">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/jtsg-logo.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-auto object-contain"
            />
          </Link>
          <div className="min-w-0">
            <Link
              href="/"
              className="text-jtsg-sand/90 text-sm hover:text-white"
            >
              ← Back
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mt-1">
              Join the Employer Network
            </h1>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {success ? (
          <div className="rounded-xl bg-jtsg-sage/20 border border-jtsg-sage p-6 text-center">
            <h2 className="text-xl font-semibold text-jtsg-green">
              Thank you for joining
            </h2>
            <p className="mt-2 text-stone-600">
              Your information has been received. A member of our team will
              reach out as we have candidates that may be a fit for your
              business.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-jtsg-green font-medium hover:underline"
            >
              Return to home
            </Link>
          </div>
        ) : (
          <>
            <Notice />
            <EmployerSignupForm
              industries={INDUSTRIES}
              onSuccess={() => setSuccess(true)}
            />
          </>
        )}
      </main>
      <EmployerFooter />
    </div>
  );
}

function Notice() {
  return (
    <div
      className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-8"
      role="region"
      aria-label="Understanding and agreement"
    >
      <h2 className="font-semibold text-amber-900">What we’re agreeing to</h2>
      <ul className="mt-2 space-y-1 text-sm text-amber-900/90">
        <li>
          <strong>Employers:</strong> Joining the network does not obligate you
          to hire anyone. You’re simply indicating that you’re open to
          considering qualified candidates we refer when you have openings in
          their area of interest.
        </li>
        <li>
          <strong>JTSG:</strong> We are not obligated to refer candidates to
          every employer in the network. We will present candidates when we
          believe there’s a good fit and when your business has (or may have)
          relevant opportunities.
        </li>
      </ul>
      <p className="mt-3 text-sm text-amber-900/80">
        By submitting this form, you confirm that you understand and agree to
        this partnership in good faith, with no binding hiring or referral
        commitment on either side.
      </p>
    </div>
  );
}
