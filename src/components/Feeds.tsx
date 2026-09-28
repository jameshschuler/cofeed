import { FeedLogList } from "./FeedLogList";
import { useFeedsContext } from "./feeds-context";

export function Feeds() {
  const { state } = useFeedsContext();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <FeedLogList />
      {state.list.loadError ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {state.list.loadError}
        </p>
      ) : null}
    </div>
  );
}
