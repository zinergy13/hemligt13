import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      throw redirect({ to: "/logga-in", search: { redirect: location.href } });
    }
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      throw redirect({ to: "/" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <>
      <div className="w-full border-b border-amber-300 bg-amber-100 px-4 py-2 text-center text-xs font-medium text-amber-900">
        Privat beta - betalningar körs i testläge och utbetalningar till värdar är inte aktiverade.
      </div>
      <Outlet />
    </>
  );
}