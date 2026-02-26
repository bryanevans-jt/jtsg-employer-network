import Link from "next/link";
import { EmployerFooter } from "@/components/EmployerFooter";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background logo: 20% opacity (use a PNG with transparent background) */}
      <div
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center"
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/jtsg-logo.png"
          alt=""
          className="h-full w-full max-h-[90vh] max-w-3xl object-contain opacity-20"
        />
      </div>

      <header className="relative z-10 bg-jtsg-green text-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Joshua Tree Service Group
          </h1>
          <p className="text-jtsg-sand/90 text-sm mt-1">
            Employer Network
          </p>
        </div>
      </header>

      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <p className="text-stone-600 mb-8">
          JTSG is a service provider for the Georgia Vocational Rehabilitation
          Agency. We help clients learn job skills and find meaningful
          employment. By joining our employer network, you’re not guaranteeing a
          job to anyone—you’re simply indicating that you’re open to working with
          us.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/join"
            className="inline-flex items-center justify-center rounded-lg bg-jtsg-green px-6 py-3 text-white font-medium hover:bg-jtsg-green/90 transition"
          >
            Join the network
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-6 py-3 text-stone-700 font-medium hover:bg-stone-50 transition"
          >
            Staff login
          </Link>
        </div>
      </main>

      <footer className="relative z-10">
        <EmployerFooter />
      </footer>
    </div>
  );
}
