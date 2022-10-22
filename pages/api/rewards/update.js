import * as Supabase from "../../../lib/supabase";
import * as Twitch from "../../../lib/twitch";
import { getUserFromCookies } from "../../../utils/getUserFromCookies";
import { until } from "@open-draft/until";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const { rewards } = req.body;

  if (rewards == null) {
    return res.status(400).end();
  }

  const { error: authorizationError, data: user} = await until(() =>
    getUserFromCookies(req.cookies)
  );

  if (authorizationError != null || user == null) {
    return res.status(401).end();
  }

  const newRewardsTrue = await Supabase.updateRewardActiveTrue(user, 
    rewards
  );

  const newRewardsFalse = await Supabase.updateRewardActiveFalse(user, 
    rewards
  );
  
  const newRewards = newRewardsTrue.concat(newRewardsFalse);
  if (newRewards == null) {
    res.status(500).end();
  }

  res.json(newRewards);
};
