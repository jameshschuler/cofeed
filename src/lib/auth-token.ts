import { supabase } from "./supabase";

export async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Authentication required.");
  }

  return token;
}
