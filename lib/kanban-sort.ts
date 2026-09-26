export interface SortableItem {
  sortOrder?: number;
}

/**
 * Calculates new sort order for drag-and-drop LexoRank float ordering.
 * Covers empty lists, top insertions, bottom insertions, between items,
 * and precision collapse safeguards.
 */
export function calculateNewOrder(items: SortableItem[], index: number): number {
  if (items.length === 0) return 1000;

  if (index === 0) {
    const firstOrder = typeof items[0]?.sortOrder === "number" ? items[0].sortOrder : 1000;
    return firstOrder > 0 ? firstOrder / 2 : firstOrder - 500;
  }

  if (index >= items.length) {
    const lastOrder = typeof items[items.length - 1]?.sortOrder === "number" ? items[items.length - 1].sortOrder! : 0;
    return lastOrder + 1000;
  }

  const prev = typeof items[index - 1]?.sortOrder === "number" ? items[index - 1].sortOrder! : 0;
  const next = typeof items[index]?.sortOrder === "number" ? items[index].sortOrder! : prev + 1000;

  if (Math.abs(next - prev) < 0.0001) {
    return prev + 0.01;
  }

  return (prev + next) / 2;
}
