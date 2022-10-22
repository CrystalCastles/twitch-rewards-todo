import * as Supabase from "../../../lib/supabase";

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { userId, streamId } = req.query;

  if (userId == null || streamId == null) {
    return res.status(400).end();
  }
  
  res.json(await Supabase.getAllUserRedeems(userId, streamId));
};