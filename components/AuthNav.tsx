"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AuthNav() {
  const [state, setState] = useState<{
    email: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState(null);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setState({
        email: user.email || "Account",
        role: profile?.role || "driver",
      });
    };

    load();

    const { data: listener } =
      supabase.auth.onAuthStateChange(() => {
        load();
      });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!state) {
    return (
      <>
        <Link className="nav" href="/register">
          Register
        </Link>

        <Link className="nav" href="/login">
          Login
        </Link>
      </>
    );
  }

  return (
    <>
      <Link className="nav" href="/driver-area">
        Driver Area
      </Link>

      {state.role === "admin" && (
        <Link className="nav" href="/admin">
          Admin
        </Link>
      )}

      <button
        className="linkButton"
        onClick={async () => {
          await createClient().auth.signOut();
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </>
  );
}
