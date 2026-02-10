import type { ReactNode } from "react";

type Props = {
  loading: boolean;
  loader: ReactNode;
  children: ReactNode;
};

export default function SectionLoader({ loading, loader, children }: Props) {
  return loading ? <>{loader}</> : <>{children}</>;
}
