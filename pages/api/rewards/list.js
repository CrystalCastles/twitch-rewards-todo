import * as Supabase from "../../../lib/supabase"

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { login } = req.query;

  if (login == null) {
    return res.status(404).end();
  }

  res.json(await Supabase.listRewardsForTwitchLogin(login));
};
