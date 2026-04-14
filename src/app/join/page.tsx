"use client";

import { useState } from "react";
import Link from "next/link";
import { EmployerSignupForm } from "@/components/EmployerSignupForm";
import { EmployerFooter } from "@/components/EmployerFooter";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { PROGRAM_NAME } from "@/lib/branding";

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
  const [crsNote, setCrsNote] = useState<string | undefined>(undefined);

  return (
    <div className="flex min-h-screen flex-col">
      <PublicSiteHeader
        maxWidthClass="max-w-2xl"
        title={`Join the ${PROGRAM_NAME}`}
        backHref="/"
        backLabel="← Home"
      />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-10">
        {success ? (
          <div className="rounded-2xl border border-jtsg-sage/40 bg-jtsg-sage/15 p-8 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-jtsg-green">Thank you for joining</h2>
            <p className="mt-3 text-stone-700 leading-relaxed">
              Your information has been received. A member of our team will reach out as we have
              candidates that may be a fit for your business.
            </p>
            {crsNote ? (
              <p className="mx-auto mt-4 max-w-md text-sm text-stone-600">{crsNote}</p>
            ) : null}
            <Link
              href="/"
              className="mt-6 inline-block text-sm font-semibold text-jtsg-green hover:underline"
            >
              Return to home
            </Link>
          </div>
        ) : (
          <>
            <Notice />
            <PrivacyBlurb />
            <EmployerSignupForm
              industries={INDUSTRIES}
              onSuccess={(meta) => {
                setCrsNote(meta?.crsEmailNote);
                setSuccess(true);
              }}
            />
          </>
        )}
      </main>
      <EmployerFooter />
    </div>
  );
}

function PrivacyBlurb() {
  return (
    <div
      className="mb-6 rounded-2xl border border-stone-200 bg-white/90 p-5 text-sm text-stone-700 shadow-sm"
      role="region"
      aria-label="Privacy and data use"
    >
      <h2 className="font-semibold text-jtsg-ink">How we use your information</h2>
      <p className="mt-2 leading-relaxed">
        Information you submit is used by Joshua Tree Service Group staff to contact you about the{" "}
        {PROGRAM_NAME} and relevant hiring opportunities. It is not sold. Access is limited to
        authorized JTSG team members involved in employer relations and workforce programs. We retain
        it only as long as needed for program operations, reporting, or legal requirements. For
        questions, contact{" "}
        <a
          href="mailto:bryan.evans@thejoshuatree.org"
          className="font-medium text-jtsg-green underline decoration-jtsg-green/40 underline-offset-2 hover:decoration-jtsg-green"
        >
          bryan.evans@thejoshuatree.org
        </a>
        .
      </p>
    </div>
  );
}

function Notice() {
  return (
    <div
      className="mb-8 rounded-2xl border border-amber-200/90 bg-amber-50/90 p-5 shadow-sm"
      role="region"
      aria-label="Understanding and agreement"
    >
      <h2 className="font-semibold text-amber-950">What we’re agreeing to</h2>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-amber-950/95">
        <li>
          <strong>Employers:</strong> Joining does not obligate you to hire anyone. You’re simply
          indicating that you’re open to considering qualified candidates we refer when you have
          openings in their area of interest.
        </li>
        <li>
          <strong>JTSG:</strong> We are not obligated to refer candidates to every organization in
          the network. We will present candidates when we believe there’s a good fit and when your
          business has (or may have) relevant opportunities.
        </li>
      </ul>
      <p className="mt-4 text-sm text-amber-950/85">
        By submitting this form, you confirm that you understand and agree to this partnership in
        good faith, with no binding hiring or referral commitment on either side.
      </p>
    </div>
  );
}
