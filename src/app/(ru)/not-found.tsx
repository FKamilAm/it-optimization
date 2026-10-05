import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-muted-foreground text-base tracking-[0.2em] uppercase">404</p>
      <h1 className="heading-subsection">Страница не найдена</h1>
      <Link
        href="/"
        className="border-border hover:border-foreground rounded-full border px-6 py-3 text-base transition-colors"
      >
        На главную
      </Link>
    </div>
  );
}
