---
name: vercel-react-best-practices
description: "React 19 & Next.js App Router performance guidelines from Vercel Engineering: waterfall elimination, bundle optimization, re-render avoidance, and Server/Client Component boundaries."
---

# Vercel React & Next.js Best Practices

Official performance and architectural guidelines for modern React 19 and Next.js App Router applications.

---

## 1. Server vs. Client Component Boundaries

- **Default to Server Components (RSC)**: Keep components on the server unless they require browser APIs, user event listeners (`onClick`, `onChange`), or React hooks (`useState`, `useEffect`).
- **Push Client Boundaries Down**: Never mark an entire page as `'use client'`. Wrap only the interactive interactive leaf components (buttons, search inputs, modals).
- **Server Data Fetching**: Fetch data directly in Server Components using async/await without introducing `useEffect` waterfalls or client loading spinners.

---

## 2. Waterfall Elimination

- **Parallel Data Fetching**: Use `Promise.all` or `Promise.allSettled` when multiple independent data sources are required:
  ```ts
  const [user, catalog] = await Promise.all([
    getUser(),
    getCatalog()
  ]);
  ```
- **Stream with Suspense**: Wrap slower components in `<Suspense fallback={<Skeleton />}>` so that fast parts of the UI render immediately.

---

## 3. Re-render Optimization & State Colocation

- **Colocate State**: Keep state as close to where it is used as possible. Moving state up unnecessarily causes parent tree re-renders.
- **Memoize Heavy Computations**: Use `useMemo` for CPU-intensive data transformations (sorting, filtering large lists like 1,400+ curriculum items).
- **Stable Callbacks**: Use `useCallback` for functions passed down to memoized child components.
- **Transitions for Non-Urgent Updates**: Use `useTransition` / `startTransition` (or `useDeferredValue`) for search inputs and filtering so typing remains responsive:
  ```tsx
  const [isPending, startTransition] = useTransition();
  const handleSearch = (q) => {
    startTransition(() => setQuery(q));
  };
  ```

---

## 4. Bundle Size & Import Hygiene

- **Dynamic Imports**: Use `next/dynamic` for heavy client modals, chart libraries, and rich text editors that are not immediately visible on initial page load:
  ```tsx
  const RichEditor = dynamic(() => import('@/components/RichEditor'), { ssr: false });
  ```
- **Avoid Barrels for Massive Libraries**: Import specific icons or modules directly rather than from root barrel files to prevent loading thousands of unused symbols into the bundle.
