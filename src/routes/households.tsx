import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/households")({
  beforeLoad: () => {
    throw redirect({ to: "/account", replace: true });
  },
});
