import clsx from "clsx";

type BadgeVariant = "new" | "popular" | "low-stock";

type BadgeProps = {
  variant: BadgeVariant;
  className?: string;
};

const copy: Record<BadgeVariant, string> = {
  new: "New",
  popular: "Popular",
  "low-stock": "Low Stock",
};

export default function Badge({ variant, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "rounded-full bg-black px-2 py-1 text-[11px] font-medium leading-[1.4] text-white",
        className
      )}
    >
      {copy[variant]}
    </span>
  );
}
