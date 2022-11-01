import * as Supabase from "./supabase";

// export async function handleUserStreamOnlineEvent(event) {
//   return Supabase.addNewUserLiveStream(event.event.broadcaster_user_id, {
//     id: event.event.id,
//     start_time: event.event.started_at,
//   });
// }

// export async function handleUserStreamOfflineEvent(event) {
//   return Supabase.markLiveStreamComplete(event.event.broadcaster_user_id);
// }

export async function handleUserRedeemEvent(event) {
  // check to make sure we are live.
  const userId = event.event.broadcaster_user_id;
  // const currentStream = await Supabase.getCurrentLiveStreamForUserId(userId);

  let activeRewards = await Supabase.getActiveRewards(userId);
  
  if (activeRewards.some(e => e.id === event.event.reward.id)) {
    // if (currentStream != null) {
    // change streamId here and supabase, also change subscription callback
    return Supabase.addTwitchUserEvent(userId, 1, {
      id: event.event.id,
      event_user_id: event.event.user_id,
      event_user_login: event.event.user_login,
      event_user_name: event.event.user_name,
      event_user_input: event.event.user_input ? event.event.user_input : null,
      event_type: "channel.channel_points_custom_reward_redemption.add",
      event_reward_id: event.event.reward.id,
      event_reward_title: event.event.reward.title,
      event_reward_cost: event.event.reward.cost,
      event_reward_prompt: event.event.reward.prompt ? event.event.reward.prompt : null,
    });
  // }
  }
  

  return false;
}

export async function handleStreamerAddRewardEvent(event) {
  // check to make sure we are live.
  // if we are, add the follow to the twitch_user_events table with the twitch user info
  // the current_stream_id and the user_id of the broadcaster
  const userId = event.event.broadcaster_user_id;
  // const currentStream = await Supabase.getCurrentLiveStreamForUserId(userId);
  
  return Supabase.createNewRewardsForUser(userId, {
    id: event.event.id,
    reward: event.event.title,
    active: false,
    event_type: "channel.channel_points_custom_reward.add",
  });
}

export async function handleStreamerUpdateRewardEvent(event) {
  // check to make sure we are live.
  // if we are, add the follow to the twitch_user_events table with the twitch user info
  // the current_stream_id and the user_id of the broadcaster
  const userId = event.event.broadcaster_user_id;
  // const currentStream = await Supabase.getCurrentLiveStreamForUserId(userId);
  
  return Supabase.updateRewardForUser(userId, {
    id: event.event.id,
    reward: event.event.title,
    event_type: "channel.channel_points_custom_reward.update",
  });
}

export async function handleStreamerRemoveRewardEvent(event) {
  // check to make sure we are live.
  // if we are, add the follow to the twitch_user_events table with the twitch user info
  // the current_stream_id and the user_id of the broadcaster
  const userId = event.event.broadcaster_user_id;
  // const currentStream = await Supabase.getCurrentLiveStreamForUserId(userId);
  
  return Supabase.removeRewardForUser(userId, {
    id: event.event.id,
  });
}

const EVENT_HANDLERS = {
  "stream.online": handleUserStreamOnlineEvent,
  "stream.offline": handleUserStreamOfflineEvent,
  "channel.channel_points_custom_reward_redemption.add": handleUserRedeemEvent,
  "channel.channel_points_custom_reward.add": handleStreamerAddRewardEvent,
  "channel.channel_points_custom_reward.update": handleStreamerUpdateRewardEvent,
  "channel.channel_points_custom_reward.remove": handleStreamerRemoveRewardEvent
};

export function handleWebhookEvent(body) {
  const {
    subscription: { type },
  } = body;

  const handler = EVENT_HANDLERS[type];

  if (handler != null) {
    // @ts-ignore There is a valid type error here, not sure I should fuddle with it?
    return handler(body);
  }

  return false;
}
