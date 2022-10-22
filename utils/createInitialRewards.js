import { bulkAddInitialRewards, removeAllRewardsForUser } from "../lib/supabase";

import { getChannelPointRewards } from "../lib/twitch";
import { getActiveTwitchAppToken } from "./getActiveTwitchAppToken";

export async function createInitialRewards(userId) {
  const token = await getActiveTwitchAppToken();

  if (token == null) {
    return "rejected";
  }

  let initialRewardList = await getChannelPointRewards(userId);

  if(initialRewardList == null || initialRewardList == undefined) {
    return;
  }

  let rewardsToAdd = [];
  
  await removeAllRewardsForUser(userId);

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

  const initialRewards = await bulkAddInitialRewards(rewardsToAdd);
  return initialRewards;
}