import Link from "next/link";
import { EmployerFooter } from "@/components/EmployerFooter";
import { PublicSiteHeader } from "@/components/PublicSiteHeader";
import { PROGRAM_NAME } from "@/lib/branding";

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jtsg-logo.png"
          alt=""
          className="h-full max-h-[88vh] w-full max-w-3xl object-contain opacity-[0.14]"
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <PublicSiteHeader
          showBackLink={false}
          title="Joshua Tree Service Group"
          subtitle={PROGRAM_NAME}
        />

        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:py-12">
          <div className="rounded-2xl border border-stone-200/80 bg-white/85 p-6 shadow-sm backdrop-blur-sm sm:p-8">
            <p className="text-base leading-relaxed text-stone-700">
              JTSG is a service provider for the Georgia Vocational Rehabilitation Agency. We help
              clients learn job skills and find meaningful employment. By joining the{" "}
              {PROGRAM_NAME}, you are not guaranteeing a job to anyone—you are simply indicating
              that you are open to working with us when roles may be a fit.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/join"
                className="inline-flex items-center justify-center rounded-lg bg-jtsg-green px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-jtsg-green-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-jtsg-green focus-visible:ring-offset-2"
              >
                Join as a partner
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-3 text-center text-sm font-semibold text-stone-800 shadow-sm transition hover:bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-jtsg-green/25"
              >
                Staff Sign In
              </Link>
            </div>
          </div>
        </main>

        <footer className="relative z-10 mt-auto">
          <EmployerFooter />
        </footer>
      </div>
    </div>
  );
}
