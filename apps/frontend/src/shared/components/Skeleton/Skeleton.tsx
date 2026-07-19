/**
 * Skeleton Component — Generic content placeholder
 *
 * Animated loading placeholders for content that hasn't loaded yet.
 * Supports line, card, circle, and custom variants. No business domain dependencies.
 */
import "./Skeleton.css";

export type SkeletonProps = {
  variant?: "line" | "card" | "circle" | "custom";
  width?: string;
  height?: string;
  count?: number;
  className?: string;
};

export function Skeleton({
  variant = "line",
  width,
  height,
  count = 1,
  className = "",
}: SkeletonProps) {
  const variantRadius: Record<string, string> = {
    line: "radius-sm",
    card: "radius-lg",
    circle: "radius-full",
    custom: "",
  };

  const items = Array.from({ length: count }, (_, i) => i);

  if (variant === "custom") {
    return <div className={`skeleton ${className}`} aria-hidden="true" />;
  }

  return (
    <div className={`flex-col gap-sm ${className}`} role="status" aria-label="Loading">
      {items.map((i) => (
        <div
          key={i}
          className={`skeleton ${variantRadius[variant] ?? "radius-md"}`}
          style={{
            width: width ?? (variant === "circle" ? "40px" : "100%"),
            height: height ?? (variant === "line" ? "16px" : variant === "card" ? "120px" : "40px"),
          }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
