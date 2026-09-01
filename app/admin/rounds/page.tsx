import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminRoundsManager from "@/components/AdminRoundsManager";

export default async function ManageRoundsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return <><h1>Manage Rounds</h1><p className="notice">You do not have administrator access.</p></>;

  const { data: rounds, error } = await supabase.from("rounds").select("id,name,event_date,venue").order("event_date");
  return <>
    <h1>Manage Rounds</h1>
    <p className="muted">Add, edit or delete championship rounds.</p>
    {error ? <p className="notice">Could not load rounds: {error.message}</p> : <AdminRoundsManager initialRounds={rounds || []} />}
  </>;
}
