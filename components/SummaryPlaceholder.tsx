type Props = {
  widthClass?: string;
};

export default function SummaryPlaceholder({ widthClass = "w-16" }: Props) {
  return <span className={`skeleton-shimmer inline-block h-4 ${widthClass} rounded-full`} />;
}
