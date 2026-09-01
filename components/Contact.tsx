"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Contact({
  driverId,
  rounds,
}: {
  driverId: string;
  rounds: any[];
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function go(formData: FormData) {
    setMessage("");
    setSending(true);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    try {
      const response = await fetch("/api/contact-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          driverId,
          roundId: String(formData.get("round_id")),
          message: String(formData.get("message")),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(
          result.error || "Something went wrong sending the contact request."
        );
        return;
      }

      setMessage(
        result.emailSent
          ? "Contact request sent and email notification delivered."
          : "Contact request saved, but the email notification could not be sent."
      );
    } catch (error) {
      console.error(error);
      setMessage("Unable to send the contact request.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form action={go} className="card space">
      <h2>Contact this driver</h2>

      <label>
        Championship round
        <select className="input" name="round_id" required>
          {rounds.map((round: any) => (
            <option key={round.id} value={round.id}>
              {round.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Message
        <textarea
          className="input space"
          name="message"
          required
          rows={5}
          defaultValue="We are interested in having you drive for our team."
        />
      </label>

      <button
        className="btn space"
        type="submit"
        disabled={sending}
      >
        {sending ? "Sending..." : "Send contact request"}
      </button>

      {message && <p className="muted">{message}</p>}
    </form>
  );
}
