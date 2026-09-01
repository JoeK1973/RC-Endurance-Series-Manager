import { requireUser } from "@/components/RequireUser";
import Availability from "@/components/Availability";

export default async function AvailabilityPage() {
  const { s, user } = await requireUser();

  const [{ data: rounds }, { data: availability }] =
    await Promise.all([
      s.from("rounds")
        .select("*")
        .order("event_date"),

      s.from("driver_availability")
        .select("*")
        .eq("driver_id", user.id),
    ]);

  return (
    <>
      <h1>My Availability</h1>

      <p className="muted">
        Mark yourself as looking for a team for any round.
      </p>

      <Availability
        rounds={rounds || []}
        initial={availability || []}
      />
    </>
  );
}
