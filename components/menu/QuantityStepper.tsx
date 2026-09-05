import { Minus, Plus } from "lucide-react";

export default function QuantityStepper({
  quantity,
  onChange,
  size = "default",
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  size?: "default" | "large";
}) {
  const buttonSize = size === "large" ? "size-10" : "size-9";
  const iconSize = size === "large" ? "size-4" : "size-3.5";

  return (
    <div className="flex items-center rounded-pill border border-clay/40">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(1, quantity - 1))}
        className={`flex ${buttonSize} items-center justify-center text-ink transition-colors hover:bg-plaster`}
      >
        <Minus className={iconSize} strokeWidth={1.75} />
      </button>
      <span className="w-6 text-center font-body text-small font-medium text-ink">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(quantity + 1)}
        className={`flex ${buttonSize} items-center justify-center text-ink transition-colors hover:bg-plaster`}
      >
        <Plus className={iconSize} strokeWidth={1.75} />
      </button>
    </div>
  );
}
