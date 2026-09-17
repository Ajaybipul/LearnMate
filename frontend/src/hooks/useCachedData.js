import { useEffect, useState } from "react";

// Simple in-memory cache shared across the whole app session (cleared on full page
// reload, and explicitly on logout - see clearDataCache below). Lets navbar pages
// show their last-loaded data instantly when you switch back to them, instead of a
// blank "Loading..." screen every single time, while still refreshing in the
// background to keep things current.
const cache = new Map();

export function clearDataCache() {
  cache.clear();
}

// key: unique string per page/query (e.g. "dashboard:courses")
// fetcher: () => Promise<data>
// deps: re-run the fetch when any of these change (like a normal useEffect dep array)
export function useCachedData(key, fetcher, deps = []) {
  const hasCached = cache.has(key);
  const [data, setData] = useState(hasCached ? cache.get(key) : undefined);
  const [loading, setLoading] = useState(!hasCached);

  const runFetch = (showLoading) => {
    if (showLoading) setLoading(true);
    return fetcher().then((result) => {
      cache.set(key, result);
      setData(result);
      setLoading(false);
      return result;
    });
  };

  useEffect(() => {
    let active = true;

    // Only show a loading state if we have nothing cached to display yet -
    // otherwise keep showing the cached data while this refresh happens quietly.
    if (!cache.has(key)) setLoading(true);
    else setData(cache.get(key));

    fetcher()
      .then((result) => {
        cache.set(key, result);
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ...deps]);

  const setDataAndCache = (value) => {
    setData((prev) => {
      const resolved = typeof value === "function" ? value(prev) : value;
      cache.set(key, resolved);
      return resolved;
    });
  };

  // Forces a fresh network fetch (bypassing what's cached) and updates both the
  // displayed data and the cache. Returns the fetched data so callers can chain off it.
  const refetch = () => runFetch(false).catch(() => undefined);

  return { data, loading, setData: setDataAndCache, refetch };
}