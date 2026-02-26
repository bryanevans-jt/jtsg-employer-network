export const APP_VERSION = "v0.7.18";

export function EmployerFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-stone-200 py-4 text-center text-sm text-stone-600">
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
        <a
          href="https://www.thejoshuatree.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-jtsg-green font-medium underline hover:no-underline"
        >
          thejoshuatree.org
        </a>
        <span aria-hidden>|</span>
        <span>{APP_VERSION}</span>
        <span aria-hidden>|</span>
        <span>© {year} Joshua Tree Service Group</span>
      </div>
    </footer>
  );
}
