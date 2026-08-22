import { useReveal } from "../../hooks/useReveal";
import { cn } from "../../utils/helpers";

/**
 * Fades + slides (or scales) content in once it scrolls into view.
 * Wrap a section/card in it; pass `delay` (ms) to stagger siblings.
 */
export default function Reveal({
  children,
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className,
  ...props
}) {
  const [ref, isVisible] = useReveal();

  return (
    <Tag
      ref={ref}
      className={cn(
        variant === "scale" ? "reveal-scale" : "reveal",
        isVisible && "reveal-visible",
        className,
      )}
      style={{ transitionDelay: isVisible ? `${delay}ms` : "0ms" }}
      {...props}
    >
      {children}
    </Tag>
  );
}
