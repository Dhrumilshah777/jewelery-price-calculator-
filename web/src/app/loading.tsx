export default function Loading() {
  return (
    <div
      className="flex min-h-dvh w-full flex-col items-center justify-center bg-white"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[#D4AF37]"
        aria-hidden
      />
    </div>
  );
}
