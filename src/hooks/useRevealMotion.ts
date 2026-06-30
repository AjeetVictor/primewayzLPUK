import { useEffect, useState } from 'react';
import type { TargetAndTransition } from 'motion/react';

/**
 * Keeps marketing content visible in SSR HTML while enabling scroll/enter
 * animations after the client has mounted.
 */
export function useRevealMotion() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return {
    ready,
    initial: (value: TargetAndTransition): TargetAndTransition | false => (ready ? value : false),
    whileInView: (value: TargetAndTransition): TargetAndTransition | undefined => (ready ? value : undefined),
    animate: (value: TargetAndTransition): TargetAndTransition | false => (ready ? value : false),
  };
}
