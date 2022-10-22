import { until } from "@open-draft/until";

const TWITCH_AUTH_URL = "https://id.twitch.tv/oauth2";
const TWITCH_API_URL = "https://api.twitch.tv/helix";

const BASE_URI = encodeURIComponent(
  process.env.NODE_ENV === "production"
    ? "https://twitch-rewards-todo-8gqt2h5xa-crystalcastles.vercel.app"
    : "https://28a2-45-46-163-235.ngrok.io/"
);

const REDIRECT_URI = encodeURIComponent(
  process.env.NODE_ENV === "production"
    ? "https://twitch-rewards-todo-8gqt2h5xa-crystalcastles.vercel.app/auth/twitch"
    : "http://localhost:3000/auth/twitch"
);

export function getOAuthUrl(state) {
  // "user:read:email", "channel:read:subscriptions"
  const scopes = ["channel:read:redemptions"];

  return `${TWITCH_AUTH_URL}/authorize?client_id=${
    process.env.TWITCH_CLIENT_ID
  }&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scopes.join(" ")}${
    state ? `&state=${state}` : ""
  }`;
}

export function getOAuthToken(code) {
  return fetch(
    `${TWITCH_AUTH_URL}/token?client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&code=${code}&grant_type=authorization_code&redirect_uri=${REDIRECT_URI}`,
    {
      method: "POST",
    }
  );
}

export function getUser(token) {
  return fetch(`${TWITCH_API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": process.env.TWITCH_CLIENT_ID,
    },
  }).then(async (response) => {
    if (response.ok) {
      const { data } = await response.json();
      const [{ displayName, offline_image_url, profile_image_url, id, login }] =
        data;
      
      return {
        displayName,
        imageUrl:
          profile_image_url.length > 0 ? profile_image_url : offline_image_url,
        id,
        login,
      };
    }
  });
}

export async function getAppAccessToken() {
  const scopes = ["channel:read:redemptions"];

  const {error, data: response} = await until(() =>
    fetch(
      `${TWITCH_AUTH_URL}/token?client_id=${
        process.env.TWITCH_CLIENT_ID
      }&client_secret=${
        process.env.TWITCH_CLIENT_SECRET
      }&grant_type=client_credentials&scope=${encodeURIComponent(
        scopes.join(" ")
      )}`,
      {
        method: "POST",
      }
    )
  );

  if (error != null) {
    return undefined;
  }

  const { access_token, expires_in } = (await response.json());

  return { token: access_token, expiresIn: expires_in };
}

export async function getChannelPointRewards(userId, token) {
  const {error, data: response} = await until(() =>
    fetch(
      `${TWITCH_API_URL}/channel_points/custom_rewards?broadcaster_id=${userId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
          "Content-Type": "application/json",
        }
      }
    )
  );

  if (error != null) {
    return undefined;
  }

  const { data } = (await response.json());

  return data;
}

export async function createWebhookSubscription(
  token,
  userId,
  type
) {
  const { error: createRequestError, data: response } = await until(() =>
    fetch(`${TWITCH_API_URL}/eventsub/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        version: "1",
        condition: {
          broadcaster_user_id: userId,
        },
        transport: {
          method: "webhook",
          // callback: `${BASE_URI}/api/webhooks/callbacks/subscription`,
          callback: "https://twitch-rewards-todo-8gqt2h5xa-crystalcastles.vercel.app/api/webhooks/callbacks/subscription",
          secret: process.env.SECRET,
        },
      }),
    })
  );
  
  if (createRequestError != null || !response.ok) {
    console.log({
      createRequestError,
      response,
      b: await response.text(),
      userId,
      token,
      id: process.env.TWITCH_CLIENT_ID,
      type,
    });
    return false;
  }
  // body or data?
  const {error: parseError, data: body } = await until(() => response.json());

  if (parseError != null || body == null) {
    return false;
  }
  const {
    data: [hook],
  } = body;

  return {
    id: hook.id,
    sub_type: hook.type,
  };
}

export async function verifyUserToken(token) {
  const {error: validateError, data: response} = await until(() =>
    fetch("https://id.twitch.tv/oauth2/validate", {
      headers: {
        Authorization: `OAuth ${token}`,
      },
    })
  );

  if (validateError != null || !response.ok) {
    return undefined;
  }

  const {error: parseError, data: validateData}= await until(() => response.json());

  if (parseError != null || validateData == null) {
    return undefined;
  }

  if(validateData.expires_in <= 0) {
    return undefined;
  }

  return validateData.login;
}