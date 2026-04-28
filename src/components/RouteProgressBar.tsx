import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

/**
 * Slim top-of-page progress bar shown while any TanStack Query is fetching or
 * mutating in the background. Hidden on the very first render so it doesn't
 * compete with skeleton placeholders, but kicks in for refetches/refresh.
 */
export function RouteProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching + mutating > 0;
  const [visible, setVisible] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      setDone(false);
      return;
    }
    if (!visible) return;
    // Small delay so the bar finishes the animation before hiding.
    setDone(true);
    const t = setTimeout(() => setVisible(false), 350);
    return () => clearTimeout(t);
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden">
      <div
        className={`h-full bg-primary transition-[width,opacity] ease-out ${
          done ? "w-full opacity-0 duration-300" : "w-2/3 opacity-100 duration-[1200ms]"
        }`}
      />
    </div>
  );
}