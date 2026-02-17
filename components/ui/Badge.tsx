import clsx from "clsx";

type Props = {
  children: "New" | "Popular" | "Low Stock";
  className?: string;
};

export default function Badge({ children, className }: Props) {
  return (
    <span
      className={clsx(
        "rounded-full bg-black px-2 py-1 text-[11px] font-medium text-white",
        className
      )}
    >
      {children}
    </span>
  );
}
