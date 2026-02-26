import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-jtsg-green text-white shadow">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold tracking-tight">
            Joshua Tree Service Group
          </h1>
          <p className="text-jtsg-sand/90 text-sm mt-1">
            Employer Network
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
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

      <footer className="border-t border-stone-200 py-4 text-center text-sm text-stone-500">
        © {new Date().getFullYear()} Joshua Tree Service Group
      </footer>
    </div>
  );
}
