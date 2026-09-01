import { requireUser } from "@/components/RequireUser";
import Availability from "@/components/Availability";

export default async function AvailabilityPage() {
  const { s, user } = await requireUser();

  // First find this user's driver record
  const { data: driver, error: driverError } = await s
    .from("drivers")
    .select("id")
    .eq("profile_id", user.id)
    .single();

  // Get all championship rounds
  const { data: rounds } = await s
    .from("rounds")
    .select("*")
    .order("event_date");

  // If there is no driver record yet, still show the page
  // but pass an empty availability list
  if (driverError || !driver) {
    return (
      <>
        <h1>My Availability</h1>

        <p className="muted">
          Mark yourself as looking for a team for any round.
        </p>

        <div className="card space">
          <p>
            Your account does not currently have a driver profile.
          </p>

          <p className="muted">
            Please complete your driver registration first.
          </p>
        </div>
      </>
    );
  }

  // Now load availability using the actual drivers.id
  const { data: availability } = await s
    .from("driver_availability")
    .select("*")
    .eq("driver_id", driver.id);

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
