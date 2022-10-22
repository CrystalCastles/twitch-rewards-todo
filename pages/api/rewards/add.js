import * as Supabase from "../../../lib/supabase";
import * as Twitch from "../../../lib/twitch";
import { getUserFromCookies } from "../../../utils/getUserFromCookies";
import { until } from "@open-draft/until";
import { getActiveTwitchAppToken } from "../../../utils/getActiveTwitchAppToken";

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { t } = JSON.parse(req.cookies.__twtk);
  const token = t;
  
  if (token == null) {
    return false;
  }
  
  const { error: authorizationError, data: user} = await until(() =>
    getUserFromCookies(req.cookies)
  );

  if (authorizationError != null || user == null) {
    return res.status(401).end();
  }

  let initialRewardList = await Twitch.getChannelPointRewards(user.id, token);
  
  if(initialRewardList == null || initialRewardList == undefined) {
    return;
  }

  let rewardsToAdd = [];
  
  await Supabase.removeAllRewardsForUser(user);

  for (const reward of initialRewardList) {
    rewardsToAdd.push({
      id: reward.id,
      user_id: reward.broadcaster_id,
      reward: reward.title,
      active: false,
      event_type: "channel.channel_points_custom_reward.add",
      updated_at: new Date().toISOString(),
    });
  }

  res.json(Supabase.bulkAddInitialRewards(rewardsToAdd));
};