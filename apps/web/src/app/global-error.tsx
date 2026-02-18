/* eslint-disable i18next/no-literal-string */
"use client";

import { useEffect } from "react";

import { logger } from "@workspace/shared/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
        {(error.digest ?? error.stack) && (
          <details>
            <summary>More details</summary>
            {error.digest && <p>{error.digest}</p>}
            {error.stack && <pre>{error.stack}</pre>}
          </details>
        )}
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
