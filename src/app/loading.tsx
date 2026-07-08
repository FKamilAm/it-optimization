export default function Loading() {
  return (
    <div className="min-h-svh bg-background" aria-hidden="true">
      <div className="container-premium px-6 py-10">
        <div className="h-10 w-48 animate-pulse rounded-full bg-muted" />
        <div className="mt-8 h-6 w-full max-w-xl animate-pulse rounded-lg bg-muted" />
        <div className="mt-3 h-6 w-full max-w-lg animate-pulse rounded-lg bg-muted/80" />
      </div>
    </div>
  );
}
