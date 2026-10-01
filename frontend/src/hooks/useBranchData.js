/**
 * useBranchData — Stale-data-safe data fetching for branch-sensitive modules.
 *
 * Automatically re-fetches whenever activeBranchId changes.
 * Uses AbortController per request cycle; cancelled requests do NOT update state.
 * Prevents Branch-A data from appearing under the Branch-B context.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * @param {Function} fetchFn  - async (signal, branchId) => data
 * @param {Array}    extraDeps - Additional dependencies that trigger re-fetch.
 */
export function useBranchData(fetchFn, extraDeps = []) {
  const { activeBranchId, isBranchSwitching } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Track which branch triggered the latest request
  const latestBranchRef = useRef(activeBranchId);

  const doFetch = useCallback(() => {
    const controller = new AbortController();
    const branchAtRequestTime = activeBranchId;
    latestBranchRef.current = branchAtRequestTime;

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const result = await fetchFn(controller.signal, branchAtRequestTime);
        // Only update state if this response belongs to the CURRENT branch
        if (latestBranchRef.current === branchAtRequestTime && !controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (!controller.signal.aborted && latestBranchRef.current === branchAtRequestTime) {
          setError(err);
          setLoading(false);
        }
      }
    })();

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBranchId, ...extraDeps]);

  useEffect(() => {
    const cleanup = doFetch();
    return cleanup;
  }, [doFetch]);

  const refetch = useCallback(() => {
    const cleanup = doFetch();
    return cleanup;
  }, [doFetch]);

  return { data, loading, error, refetch };
}

export default useBranchData;
