import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/vard")({
  component: HostLayout,
});

function HostLayout() {
  return <Outlet />;
}