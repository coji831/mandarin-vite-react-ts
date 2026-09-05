/**
 * @file shared/utils/cn.ts
 * @description Pure class-name joiner (clsx-style) for conditional className
 * composition. Framework-free, no DOM access.
 */

export type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Joins truthy class values into a single space-separated string.
 * Falsy entries (undefined, null, false, 0, "") and nested arrays are filtered
 * out/flattened, so callers can pass conditionals like `cond && "is-active"`.
 *
 * @example
 * cn("btn", isActive && "is-active", ["px-2", null, "py-1"]) // "btn is-active px-2 py-1"
 */
export function cn(...values: ClassValue[]): string {
  const parts: string[] = [];

  for (const value of values) {
    if (!value) continue; // filters undefined, null, false, 0, ""
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) parts.push(nested);
    } else {
      parts.push(String(value));
    }
  }

  return parts.join(" ");
}
