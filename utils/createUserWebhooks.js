import * as Supabase from "../lib/supabase";
import * as Twitch from "../lib/twitch";

import { getActiveTwitchAppToken } from "./getActiveTwitchAppToken";

export async function createUserWebhooks(twitchUser) {
  const token = await getActiveTwitchAppToken();

  if (token == null) {
    return false;
  }
  // TODO: Maybe user: createTwitchEventSubscription, here?
  const streamOnline = "stream.online";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, streamOnline))) {
    const onlineData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      streamOnline
    );
      
    if (!onlineData) {
      return false;
    }
    await Supabase.addNewUserWebhookSubscription(twitchUser, onlineData);
  }

  // Sub to streamer offline events
  const streamOffline = "stream.offline";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, streamOffline))) {
    const offlineData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      streamOffline
    );

    if (!offlineData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, offlineData);
  }

  const channelPointsRewardAdd = "channel.channel_points_custom_reward.add";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, channelPointsRewardAdd))) {
    const rewardAddData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      channelPointsRewardAdd
    );

    if (!rewardAddData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, rewardAddData);
  }

  const channelPointsRewardUpdate = "channel.channel_points_custom_reward.update";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, channelPointsRewardUpdate))) {
    const rewardUpdateData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      channelPointsRewardUpdate
    );

    if (!rewardUpdateData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, rewardUpdateData);
  }

  const channelPointsRewardRemove = "channel.channel_points_custom_reward.remove";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, channelPointsRewardRemove))) {
    const rewardRemoveData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      channelPointsRewardRemove
    );

    if (!rewardRemoveData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, rewardRemoveData);
  }

  const channelPointsRewardRedemptionAdd = "channel.channel_points_custom_reward_redemption.add";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, channelPointsRewardRedemptionAdd))) {
    const rewardRedemptionAddData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      channelPointsRewardRedemptionAdd
    );

    if (!rewardRedemptionAddData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, rewardRedemptionAddData);
  }

  const channelPointsRewardRedemptionUpdate = "channel.channel_points_custom_reward_redemption.update";
  if (!(await Supabase.doesUserHaveWebhook(twitchUser, channelPointsRewardRedemptionUpdate))) {
    const rewardRedemptionUpdateData = await Twitch.createWebhookSubscription(
      token,
      twitchUser.id,
      channelPointsRewardRedemptionUpdate
    );

    if (!rewardRedemptionUpdateData) {
      return false;
    }

    await Supabase.addNewUserWebhookSubscription(twitchUser, rewardRedemptionUpdateData);
  }

  return true;
}
