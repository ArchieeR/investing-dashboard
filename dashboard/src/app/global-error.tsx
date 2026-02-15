"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0C0C0C] text-[#E4E4E7]">
        <div className="flex min-h-screen flex-col items-center justify-center">
          <h2 className="mb-4 text-2xl font-semibold">Something went wrong</h2>
          <p className="mb-6 text-[#A1A1AA]">
            A critical error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="rounded-md bg-[#FF6B00] px-4 py-2 text-sm font-medium text-[#0C0C0C] hover:bg-[#FF6B00]/90 focus:outline-none focus:ring-2 focus:ring-[#FF6B00] focus:ring-offset-2 focus:ring-offset-[#0C0C0C]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
