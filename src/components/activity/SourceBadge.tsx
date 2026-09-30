import { Badge } from "../ui/badge";

const SOURCE_LABELS: Record<string, string> = {
  cofeed: "CoFeed",
  nara: "Nara",
};

export function SourceBadge({ source }: { source: string }) {
  return <Badge>{SOURCE_LABELS[source] ?? source}</Badge>;
}
