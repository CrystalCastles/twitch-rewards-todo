import * as Supabase from "../../../lib/supabase";

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { id } = req.query;

  if (id == null) {
    return res.status(400).end();
  }

  res.json(await Supabase.listAllWebhooksForUser(id));
};