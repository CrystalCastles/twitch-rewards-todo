import * as Supabase from "../../../lib/supabase";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { userId, redeemId } = req.body;

   // const streamId = await getCurrentLiveStreamForUserId(userId);
  const streamId = 1;
  
  if (userId == null || streamId == null || redeemId == null) {
    return res.status(400).end();
  }
  
  if(redeemId === "all") {
    res.json(await Supabase.updateRedeemCompleteAll(userId, streamId));
  } else {
    res.json(await Supabase.updateRedeemComplete(userId, streamId, redeemId));
  }
};