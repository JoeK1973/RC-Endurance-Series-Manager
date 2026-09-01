"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Round = {
  id: string;
  name: string;
  event_date: string;
  venue: string;
};

type AvailabilityRow = {
  driver_id: string;
  round_id: string;
  status: string;
};

export default function Availability({
  rounds,
  initial,
}: {
  rounds: Round[];
  initial: AvailabilityRow[];
}) {
  const [rows, setRows] = useState<AvailabilityRow[]>(initial);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function saveAvailability(
    roundId: string,
    status: string
  ) {
    setSaving(roundId);
    setMessage("");

    const supabase = createClient();

    // Get the currently logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setMessage("Please log in before updating your availability.");
      setSaving(null);
      return;
    }

    // Find the driver's actual database record.
    // driver_availability.driver_id references drivers.id,
    // NOT the Supabase Auth user ID.
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (driverError || !driver) {
      console.error(driverError);

      setMessage(
        "No driver profile was found for your account. Please contact the administrator."
      );

      setSaving(null);
      return;
    }

    // Save using the actual drivers.id value
    const { error } = await supabase
      .from("driver_availability")
      .upsert(
        {
          driver_id: driver.id,
          round_id: roundId,
          status: status,
        },
        {
          onConflict: "driver_id,round_id",
        }
      );

    if (error) {
      console.error(error);
      setMessage(`Error saving availability: ${error.message}`);
      setSaving(null);
      return;
    }

    // Update the page immediately
    setRows((currentRows) => [
      ...currentRows.filter(
        (row) =>
          !(
            row.driver_id === driver.id &&
            row.round_id === roundId
          )
      ),
      {
        driver_id: driver.id,
        round_id: roundId,
        status,
      },
    ]);

    setMessage("Availability saved successfully.");
    setSaving(null);
  }

  return (
    <div className="card p-6 mt-5">
      <p className="muted">
        Select your availability for each championship round.
      </p>

      <div className="space-y-4 mt-5">
        {rounds.map((round) => {
          // We need to find the availability record for this round.
          // Since the initial data may already contain the driver's ID,
          // we only match by round_id here.
          const availability = rows.find(
            (row) => row.round_id === round.id
          );

          const status =
            availability?.status || "unavailable";

          return (
            <div
              key={round.id}
              className="card p-5"
            >
              <h2>{round.name}</h2>

              <p className="muted">
                {round.event_date}
                {round.venue ? ` · ${round.venue}` : ""}
              </p>

              <select
                className="input mt-3"
                value={status}
                disabled={saving === round.id}
                onChange={(event) =>
                  saveAvailability(
                    round.id,
                    event.target.value
                  )
                }
              >
                <option value="unavailable">
                  Unavailable
                </option>

                <option value="looking_for_team">
                  Available — looking for a team
                </option>

                <option value="reserve">
                  Available as reserve
                </option>

                <option value="affiliated">
                  Already affiliated with a team
                </option>
              </select>

              {saving === round.id && (
                <p className="muted mt-2">
                  Saving...
                </p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <p className="notice mt-5">
          {message}
        </p>
      )}
    </div>
  );
}
