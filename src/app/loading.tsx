export default function Loading() {
  return (
    <div className="bg-background min-h-svh" aria-hidden="true">
      <div className="container-premium px-6 py-10">
        <div className="bg-muted h-10 w-48 animate-pulse rounded-full" />
        <div className="bg-muted mt-8 h-6 w-full max-w-xl animate-pulse rounded-lg" />
        <div className="bg-muted/80 mt-3 h-6 w-full max-w-lg animate-pulse rounded-lg" />
      </div>
    </div>
  );
}
