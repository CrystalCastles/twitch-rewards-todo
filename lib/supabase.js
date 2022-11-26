import { until } from "@open-draft/until";
import { createClient } from "@supabase/supabase-js";
import { mutate } from "swr";

let client;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_API_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_API_KEY ?? "";

export async function addUserConfig(user, config) {
  const base = getClientInstance();
  const { error, data: record } = await until(async () =>
    base
      .from("user_config")
      .insert(
        [
          {
            ...config,
            user_id: user.id ? user.id : user,
            updated_at: new Date().toISOString(),
          },
        ],
        { returning: "representation" }
      )
      .single()
  );

  if (error != null || record.data == null) {
    return null;
  }

  return record.data;
}

export async function updateUserConfig(user, config) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("user_config")
      .update(
        [
          {
            ...config,
            user_id: user.id ? user.id : user,
            updated_at: new Date().toISOString(),
          },
        ],
        { returning: "representation" }
      )
      .eq("user_id", user.id ? user.id : user)
      .single()
  );

  if (error != null || record.data == null) {
    return null;
  }
  
  return record.data;
}

export async function getUserConfig(user = null, kofiKey = null) {
  const base = getClientInstance();
  if(user) {
    const { error, data: record } = await until(async () =>
      base.from("user_config").select().eq("user_id", user.id ? user.id : user).single()
    );

    if (error != null || record.data == null || record.data.length == 0) {
      return null;
    }

    return record.data;
  } else if(kofiKey) {
    const { error, data: record } = await until(async () =>
      base.from("user_config").select().eq("kofi_key", kofiKey).single()
    );

    if (error != null || record.data == null || record.data.length == 0) {
      return null;
    }

    return record.data;
  }
}

export function userRewardsUpdated(key) {
  const base = getClientInstance();
  const mySubscription = base
    .from("user_events")
    .on("*", (payload) => {
      mutate(key);
    })
    .subscribe();

  return () => {
    base.removeSubscription(mySubscription);
  };
}

export function addNewUser(user) {
  return insert("users", {
    id: user.id,
    login: user.login,
    profile_img_url: user.imageUrl,
  });
}

export async function getUserById(id) {
  const base = getClientInstance();

  const { error, data: user } = await until(async () =>
    base.from("users").select().eq("id", id).single()
  );

  if (error != null) {
    return null;
  }

  return user.data;
}

export async function getUserByTwitchLogin(login) {
  const base = getClientInstance();

  const { error, data: user } = await until(async () =>
    base.from("users").select().eq("login", login).single()
  );

  if (error != null) {
    return null;
  }

  return user.data;
}

export async function listRewardsForTwitchLogin(login) {
  const base = getClientInstance();
  const user = await getUserByTwitchLogin(login);
  if (user == null) {
    return [];
  }
  const { error, data: record } = await until(async () =>
    base.from("user_rewards").select().eq("user_id", user.id)
  );
  if (error != null || record.data == null) {
    return [];
  }
  return record.data;
}

export async function listAllWebhooksForUser(userId) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base.from("twitch_webhooks").select().eq("user_id", userId)
  );

  if (error != null || record.data == null) {
    return [];
  }

  return record.data;
}

export async function listRewardsForUser(user) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base.from("user_rewards").select().eq("user_id", user.id)
  );

  if (error != null || record == null) {
    return [];
  }

  return record.data;
}

export async function addNewTwitchToken(token, expires_in) {
  return insert("twitch_tokens", {
    token,
    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
  });
}

export function addNewUserWebhookSubscription(user, hook) {
  return insert("twitch_webhooks", {
    ...hook,
    user_id: user.id,
  });
}

export async function removeUserWebhookSubscription(subscriptionId) {
  const base = getClientInstance();

  const { error } = await until(async () =>
    base.from("twitch_webhooks").delete().eq("id", subscriptionId)
  );

  return error == null;
}

export async function doesUserHaveWebhook(user, type) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("twitch_webhooks")
      .select()
      .eq("sub_type", type)
      .eq("user_id", user.id)
      .single()
  );

  if (error != null || record.data == null) {
    return false;
  }

  return record.data;
}

export async function trackRecievedTwitchWebhook(messageId, timestamp) {
  // TODO: make sure that the ID is unique, so this insert will fail
  // if we are trying to count a message twice.
  
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("twitch_webhook_log")
      .insert([
        {
          log_id: messageId,
          received_at: timestamp
        },
      ],
      { returning: "representation" })
      .select()
      .single()
  );

  console.log(error, record)
  if (error != null || record.data == null) {
    return false;
  }

  return record.data;
}

export function addUserEvent(userId, streamId, data) {
  return insert("user_events", {
    ...data,
    user_id: userId,
    stream_id: streamId,
    created_at: new Date().toISOString(),
  });
}

export async function bulkAddInitialRewards(rewards) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base.from("user_rewards").insert(rewards).select()
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function removeAllRewardsForUser(user) {
  const base = getClientInstance();

  const { error } = await until(async () =>
    base.from("user_rewards").delete().eq("user_id", user.id)
  );

  return error != null;
}

export async function createNewRewardsForUser(user, data) {
  const base = getClientInstance();
  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .insert(
        [
          {
            ...data,
            user_id: user.id ? user.id : user,
            updated_at: new Date().toISOString(),
          },
        ],
        { returning: "representation" }
      )
      .single()
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function updateRewardForUser(user, data) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .update(
        [
          {
            ...data,
            user_id: user.id ? user.id : user,
            updated_at: new Date().toISOString(),
          },
        ],
        { returning: "representation" }
      )
      .eq("user_id", user.id ? user.id : user)
      .eq("id", data.id)
      .select()
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function updateRewardActiveTrue(user, data) {
  const base = getClientInstance();
  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .update([{ active: true, updated_at: new Date().toISOString() }], {
        returning: "representation",
      })
      .eq("user_id", user.id ? user.id : user)
      .in("id", data)
      .select()
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function updateRewardActiveFalse(user, data) {
  const base = getClientInstance();
  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .update([{ active: false, updated_at: new Date().toISOString() }], {
        returning: "representation",
      })
      .eq("user_id", user.id ? user.id : user)
      .not("id", "in", `(${data})`)
      .select()
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function removeRewardForUser(user, data) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .delete()
      .eq("user_id", user.id ? user.id : user)
      .eq("id", data.id)
  );

  if (error != null || record.data == null) {
    return undefined;
  }

  return record.data;
}

export async function getAllUserRedeems(userId, streamId) {
  const base = getClientInstance();

  const { error, data: records } = await until(async () =>
    base
      .from("user_events")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .eq("stream_id", streamId)
      .eq("completed", false)
      .order("created_at")
  );

  if (error != null || records.data == null) {
    return { count: 0 };
  }

  return {
    count: records.count ?? 0,
    events: records.data,
  };
}

export async function updateRedeemComplete(userId, streamId, redeemId) {
  const base = getClientInstance();

  const { error, data: records } = await until(async () =>
    base
      .from("user_events")
      .update([{ completed: true }], { returning: "representation" })
      .eq("id", redeemId)
      .eq("user_id", userId)
      .eq("stream_id", streamId)
      .select()
  );

  if (error != null || records.data == null) {
    return undefined;
  }

  return records.data;
}

export async function updateRedeemCompleteAll(userId, streamId) {
  const base = getClientInstance();

  const { error, data: records } = await until(async () =>
    base
      .from("user_events")
      .update([{ completed: true }], { returning: "representation" })
      .eq("user_id", userId)
      .eq("stream_id", streamId)
      .select()
  );

  if (error != null || records.data == null) {
    return undefined;
  }

  return records.data;
}

export async function getActiveRewards(user) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("user_rewards")
      .select("id")
      .eq("active", "true")
      .eq("user_id", user.id ? user.id : user)
  );

  if (error != null || record.data == null) {
    return false;
  }

  return record.data;
}

export async function getCurrentLiveStreamForUserId(userId) {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("live_streams")
      .select()
      .eq("user_id", userId)
      .eq("is_complete", false)
      .single()
  );
  if (error != null || record.data == null) {
    return undefined;
  }
  return record.data;
}

export async function getLatestActiveTwitchToken() {
  const base = getClientInstance();

  const { error, data: record } = await until(async () =>
    base
      .from("twitch_tokens")
      .select("token")
      .gt("expires_at", new Date().toISOString())
      .single()
  );

  if (error != null || record?.data?.token == null) {
    return undefined;
  }

  return record.data.token;
}

function getClientInstance() {
  if (client == null) {
    client = createClient(supabaseUrl, supabaseKey);
  }

  return client;
}

async function insert(tableName, data) {
  const base = getClientInstance();

  const { error } = await until(async () =>
    base.from(tableName).insert([data])
  );

  return error == null;
}
