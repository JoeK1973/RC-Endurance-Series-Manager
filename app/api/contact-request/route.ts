import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const driverId = body.driverId;
    const roundId = body.roundId;
    const message = body.message;

    if (!driverId || !roundId || !message) {
      return NextResponse.json(
        {
          error: "Driver, round and message are required.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "You must be logged in.",
        },
        {
          status: 401,
        }
      );
    }

    // Confirm the logged-in user manages a team
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, name, club, manager_id")
      .eq("manager_id", user.id)
      .single();

    if (teamError || !team) {
      return NextResponse.json(
        {
          error: "You need to create a team before contacting drivers.",
        },
        {
          status: 403,
        }
      );
    }

    // Get the team manager's details
    const { data: managerProfile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .single();

    // Get the driver's profile and email
    const { data: driver } = await supabase
      .from("drivers")
      .select(`
        profile_id,
        profiles (
          name,
          email
        )
      `)
      .eq("profile_id", driverId)
      .single();

    if (!driver) {
      return NextResponse.json(
        {
          error: "Driver not found.",
        },
        {
          status: 404,
        }
      );
    }

    const driverProfile = Array.isArray(driver.profiles)
      ? driver.profiles[0]
      : driver.profiles;

    if (!driverProfile?.email) {
      return NextResponse.json(
        {
          error: "This driver does not have an email address.",
        },
        {
          status: 400,
        }
      );
    }

    // Get the championship round
    const { data: round } = await supabase
      .from("rounds")
      .select("name, event_date, venue")
      .eq("id", roundId)
      .single();

    if (!round) {
      return NextResponse.json(
        {
          error: "Championship round not found.",
        },
        {
          status: 404,
        }
      );
    }

    // Save the contact request first
    const { error: contactError } = await supabase
      .from("contact_requests")
      .insert({
        team_id: team.id,
        driver_id: driverId,
        round_id: roundId,
        message,
      });

    if (contactError) {
      return NextResponse.json(
        {
          error: contactError.message,
        },
        {
          status: 400,
        }
      );
    }

    // Send email notification if Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: true,
        emailSent: false,
      });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const from =
      process.env.RESEND_FROM_EMAIL ||
      "RC Endurance Series <onboarding@resend.dev>";

    const { error: emailError } = await resend.emails.send({
      from,
      to: [driverProfile.email],
      subject: `Driver request from ${team.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h1>You've received a driver request</h1>

          <p>
            Hello ${driverProfile.name || "Driver"},
          </p>

          <p>
            <strong>${team.name}</strong> is interested in contacting you
            about driving for their team.
          </p>

          <h2>Round</h2>

          <p>
            <strong>${round.name}</strong>
            ${
              round.event_date
                ? `<br>${new Date(
                    round.event_date
                  ).toLocaleDateString("en-GB")}`
                : ""
            }
            ${
              round.venue
                ? `<br>${round.venue}`
                : ""
            }
          </p>

          <h2>Message from the team</h2>

          <p style="white-space: pre-line;">
            ${message}
          </p>

          <hr>

          <p>
            <strong>Team:</strong> ${team.name}
            ${
              team.club
                ? `<br><strong>Club:</strong> ${team.club}`
                : ""
            }
          </p>

          <p>
            <strong>Contact:</strong>
            ${managerProfile?.name || "Team Manager"}
            ${
              managerProfile?.email
                ? ` (${managerProfile.email})`
                : ""
            }
          </p>

          <p>
            You can also view this request in your
            RC Endurance Series Driver Area.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Email error:", emailError);

      return NextResponse.json({
        success: true,
        emailSent: false,
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
    });
  } catch (error) {
    console.error("Contact request error:", error);

    return NextResponse.json(
      {
        error: "An unexpected error occurred.",
      },
      {
        status: 500,
      }
    );
  }
}
