"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Round = {
  id: string;
  name: string;
  event_date: string;
  venue: string | null;
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

  async function saveAvailability(roundId: string, status: string) {
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

    // driver_availability.driver_id references drivers.profile_id,
    // which matches the logged-in user's ID.
    const { error: saveError } = await supabase
      .from("driver_availability")
      .upsert(
        {
          driver_id: user.id,
          round_id: roundId,
          status,
        },
        {
          onConflict: "driver_id,round_id",
        }
      );

    if (saveError) {
      console.error(saveError);
      setMessage(`Error saving availability: ${saveError.message}`);
      setSaving(null);
      return;
    }

    // Update the page immediately after a successful save
    setRows((currentRows) => [
      ...currentRows.filter((row) => row.round_id !== roundId),
      {
        driver_id: user.id,
        round_id: roundId,
        status,
      },
    ]);

    setMessage("Availability saved successfully.");
    setSaving(null);
  }

  return (
    <div className="card space">
      <p className="muted">
        Select your availability for each championship round.
      </p>

      <div className="grid space">
        {rounds.map((round) => {
          const availability = rows.find(
            (row) => row.round_id === round.id
          );

          const status = availability?.status || "unavailable";

          return (
            <div key={round.id} className="card">
              <h2>{round.name}</h2>

              <p className="muted">
                {round.event_date}
                {round.venue ? ` · ${round.venue}` : ""}
              </p>

              <select
                className="input"
                value={status}
                disabled={saving === round.id}
                onChange={(event) =>
                  saveAvailability(round.id, event.target.value)
                }
              >
                <option value="unavailable">Unavailable</option>

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
                <p className="muted">Saving...</p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <p className="notice">{message}</p>
      )}
    </div>
  );
}
