"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Team = {
  id: string;
  name: string;
  club: string | null;
  manager_id: string | null;
};

type Round = {
  id: string;
  name: string;
  event_date: string;
};

type Driver = {
  profile_id: string;
  classes: string[] | null;
  experience: string | null;
  bio: string | null;
  endurance_experience: string | null;
  profiles:
    | {
        id: string;
        name: string | null;
        email: string | null;
      }
    | {
        id: string;
        name: string | null;
        email: string | null;
      }[]
    | null;
};

type TeamDriver = {
  driver_id: string;
};

export default function MyTeamPage() {
  const [team, setTeam] = useState<Team | null>(null);
  const [teamName, setTeamName] = useState("");
  const [club, setClub] = useState("");

  const [rounds, setRounds] = useState<Round[]>([]);
  const [roundId, setRoundId] = useState("");

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teamDrivers, setTeamDrivers] = useState<TeamDriver[]>([]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (team && roundId) {
      loadTeamDrivers(team.id, roundId);
    }
  }, [team, roundId]);

  async function loadData() {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please log in.");
      setLoading(false);
      return;
    }

    const [
      { data: teamData, error: teamError },
      { data: roundsData },
      { data: driversData },
    ] = await Promise.all([
      supabase
        .from("teams")
        .select("*")
        .eq("manager_id", user.id)
        .limit(1),

      supabase
        .from("rounds")
        .select("*")
        .order("event_date"),

      supabase
        .from("drivers")
        .select(`
          profile_id,
          classes,
          experience,
          bio,
          endurance_experience,
          profiles (
            id,
            name,
            email
          )
        `),
    ]);

    if (teamError) {
      setMessage(teamError.message);
    }

    const foundTeam = teamData?.[0] || null;

    setTeam(foundTeam);

    if (foundTeam) {
      setTeamName(foundTeam.name || "");
      setClub(foundTeam.club || "");
    }

    setRounds(roundsData || []);

    if (roundsData?.[0]) {
      setRoundId(roundsData[0].id);
    }

    setDrivers((driversData || []) as Driver[]);

    setLoading(false);
  }

  async function loadTeamDrivers(
    teamId: string,
    selectedRoundId: string
  ) {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("team_drivers")
      .select("driver_id")
      .eq("team_id", teamId)
      .eq("round_id", selectedRoundId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTeamDrivers(data || []);
  }

  async function saveTeam(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Please log in.");
      return;
    }

    if (team) {
      const { error } = await supabase
        .from("teams")
        .update({
          name: teamName,
          club,
        })
        .eq("id", team.id);

      if (error) {
        setMessage(error.message);
        return;
      }

      setTeam({
        ...team,
        name: teamName,
        club,
      });

      setMessage("Team updated.");
      return;
    }

    const { data, error } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        club,
        manager_id: user.id,
      })
      .select()
      .single();

    if (error || !data) {
      setMessage(error?.message || "Could not create team.");
      return;
    }

    setTeam(data);

    await supabase
      .from("profiles")
      .update({
        role: "team_manager",
      })
      .eq("id", user.id);

    setMessage("Team created.");
  }

  async function addDriver(driverId: string) {
    if (!team || !roundId) return;

    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("team_drivers")
      .insert({
        team_id: team.id,
        driver_id: driverId,
        round_id: roundId,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setTeamDrivers((current) => [
      ...current,
      { driver_id: driverId },
    ]);

    setMessage("Driver added to the team for this round.");
  }

  async function removeDriver(driverId: string) {
    if (!team || !roundId) return;

    setMessage("");

    const supabase = createClient();

    const { error } = await supabase
      .from("team_drivers")
      .delete()
      .eq("team_id", team.id)
      .eq("driver_id", driverId)
      .eq("round_id", roundId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setTeamDrivers((current) =>
      current.filter((driver) => driver.driver_id !== driverId)
    );

    setMessage("Driver removed from this round.");
  }

  function getProfile(
    driver: Driver
  ): {
    id: string;
    name: string | null;
    email: string | null;
  } | null {
    if (!driver.profiles) return null;

    if (Array.isArray(driver.profiles)) {
      return driver.profiles[0] || null;
    }

    return driver.profiles;
  }

  const selectedDriverIds = teamDrivers.map(
    (driver) => driver.driver_id
  );

  if (loading) {
    return <p>Loading team...</p>;
  }

  return (
    <>
      <h1>My Team</h1>

      <div className="card space">
        <h2>{team ? "Manage Team" : "Create Your Team"}</h2>

        <form onSubmit={saveTeam}>
          <label>
            Team name
            <input
              className="input"
              required
              value={teamName}
              placeholder="Team name"
              onChange={(event) =>
                setTeamName(event.target.value)
              }
            />
          </label>

          <label>
            Club
            <input
              className="input"
              value={club}
              placeholder="Optional club name"
              onChange={(event) =>
                setClub(event.target.value)
              }
            />
          </label>

          <button className="btn space" type="submit">
            {team ? "Save Changes" : "Create Team"}
          </button>
        </form>
      </div>

      {!team && (
        <div className="card space">
          <p className="muted">
            Create your team first. Once created, you can add
            drivers to each championship round.
          </p>
        </div>
      )}

      {team && (
        <>
          <div className="card space">
            <h2>Round Selection</h2>

            {rounds.length === 0 ? (
              <p className="muted">
                No championship rounds have been created yet.
              </p>
            ) : (
              <select
                className="input"
                value={roundId}
                onChange={(event) =>
                  setRoundId(event.target.value)
                }
              >
                {rounds.map((round) => (
                  <option key={round.id} value={round.id}>
                    {round.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {roundId && (
            <>
              <div className="card space">
                <h2>Drivers in Your Team</h2>

                {selectedDriverIds.length === 0 ? (
                  <p className="muted">
                    No drivers have been added for this round yet.
                  </p>
                ) : (
                  <div className="grid two">
                    {drivers
                      .filter((driver) =>
                        selectedDriverIds.includes(
                          driver.profile_id
                        )
                      )
                      .map((driver) => {
                        const profile = getProfile(driver);

                        return (
                          <div
                            className="card"
                            key={driver.profile_id}
                          >
                            <h3>
                              {profile?.name || "Unnamed Driver"}
                            </h3>

                            <p className="muted">
                              {driver.experience ||
                                "Experience not specified"}
                            </p>

                            <button
                              className="btn"
                              onClick={() =>
                                removeDriver(
                                  driver.profile_id
                                )
                              }
                            >
                              Remove from team
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              <div className="card space">
                <h2>Add Drivers</h2>

                <p className="muted">
                  Select registered drivers to add to your team
                  for the selected round.
                </p>

                <div className="grid two">
                  {drivers
                    .filter(
                      (driver) =>
                        !selectedDriverIds.includes(
                          driver.profile_id
                        )
                    )
                    .map((driver) => {
                      const profile = getProfile(driver);

                      return (
                        <div
                          className="card"
                          key={driver.profile_id}
                        >
                          <h3>
                            {profile?.name || "Unnamed Driver"}
                          </h3>

                          <p className="muted">
                            {driver.classes?.join(", ") ||
                              "No classes specified"}
                          </p>

                          <p className="muted">
                            {driver.experience ||
                              "Experience not specified"}
                          </p>

                          <button
                            className="btn"
                            onClick={() =>
                              addDriver(driver.profile_id)
                            }
                          >
                            Add to team
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {message && (
        <div className="notice space">
          {message}
        </div>
      )}
    </>
  );
}
