import Link from "next/link";

type PublicSiteHeaderProps = {
  title: string;
  /** Shown under the title in sand tone */
  subtitle?: string;
  /** When false, no back link (e.g. home). */
  showBackLink?: boolean;
  backHref?: string;
  backLabel?: string;
  /** Outer content width under the green bar */
  maxWidthClass?: string;
};

/**
 * Warm public header: logo on a white circle, JTSG green bar, optional back link.
 */
export function PublicSiteHeader({
  title,
  subtitle,
  showBackLink = true,
  backHref = "/",
  backLabel = "← Home",
  maxWidthClass = "max-w-4xl",
}: PublicSiteHeaderProps) {
  return (
    <header className="bg-jtsg-green text-white shadow-md">
      <div
        className={`${maxWidthClass} mx-auto flex flex-wrap items-start gap-4 px-4 py-5 sm:items-center sm:gap-5 sm:py-6`}
      >
        <Link
          href="/"
          className="box-border flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-2.5 shadow-md ring-2 ring-white/50 transition hover:ring-white hover:shadow-lg sm:h-[4.25rem] sm:w-[4.25rem]"
          aria-label="Joshua Tree Service Group — home"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/jtsg-logo.png"
            alt=""
            width={48}
            height={48}
            className="h-11 w-11 origin-center scale-[2] object-contain sm:h-12 sm:w-12 sm:scale-[2]"
          />
        </Link>
        <div className="min-w-0 flex-1 pt-0.5 sm:pt-0">
          {showBackLink ? (
            <Link
              href={backHref}
              className="text-sm text-jtsg-sand/95 transition hover:text-white"
            >
              {backLabel}
            </Link>
          ) : (
            <a
              href="https://www.thejoshuatree.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-jtsg-sand/95 transition hover:text-white"
            >
              thejoshuatree.org ↗
            </a>
          )}
          <h1 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-jtsg-sand/90 sm:text-base">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </header>
  );
}
