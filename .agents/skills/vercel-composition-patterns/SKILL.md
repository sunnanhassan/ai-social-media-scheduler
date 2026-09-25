---
name: vercel-composition-patterns
description: "Advanced React composition patterns: compound components, slot patterns, render props, and decoupled context architecture for robust, scalable UI systems."
---

# Vercel React Composition Patterns

Guidelines for building composable, maintainable, and type-safe UI components in enterprise React applications.

---

## 1. Compound Component Pattern

Allow related components to communicate implicitly via React Context while giving consumers flexible control over JSX layout:

```tsx
<Modal open={isOpen} onOpenChange={setIsOpen}>
  <Modal.Header>
    <Modal.Title>Enrollment Confirmation</Modal.Title>
    <Modal.CloseButton />
  </Modal.Header>
  <Modal.Body>
    Are you sure you want to enroll in this roadmap?
  </Modal.Body>
  <Modal.Footer>
    <Modal.Action onClick={handleConfirm}>Confirm</Modal.Action>
  </Modal.Footer>
</Modal>
```

---

## 2. Inversion of Control & Slot Pattern

- Use child rendering and slot props (`headerSlot`, `actionsSlot`, or `asChild` composition) to avoid prop drilling and ballooning boolean flags.
- **Radix UI `Slot` Pattern**: Use `@radix-ui/react-slot` to allow components like `<Button asChild>` to merge props onto a custom `<Link>` element without rendering duplicate wrapper tags.

---

## 3. Decoupled Context Architecture

- **Split State and Dispatch**: Avoid putting both read state and write actions in a single monolithic context. Splitting them prevents components that only dispatch actions from re-rendering when state changes:
  ```tsx
  const StateContext = createContext<DashboardState | null>(null);
  const DispatchContext = createContext<DashboardDispatch | null>(null);
  ```
- **Custom Hooks with Null Checks**: Always encapsulate `useContext` within a dedicated hook that throws a helpful error if used outside its Provider:
  ```tsx
  export function useDashboard() {
    const ctx = useContext(StateContext);
    if (!ctx) throw new Error('useDashboard must be used within DashboardProvider');
    return ctx;
  }
  ```

---

## 4. Reusability & Size Constraint Enforcement

- **Max 300 Lines per Component**: Split large presentation files into cohesive primitives (Header, Body, Controls, EmptyState).
- **Pure Presentational Components**: Keep pure presentational components decoupled from Supabase or fetch logic. Pass data via props or slots.
