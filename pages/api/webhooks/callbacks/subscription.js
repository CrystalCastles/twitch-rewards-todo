import * as Supabase from '../../../../lib/supabase';
import { sha256 } from "js-sha256";

import { handleWebhookEvent } from "../../../../lib/twitch-events";

export default async (req, res) => {
  // N.B Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.end();
  }

  if (req.method !== "POST") {
    return res.status(405).end();
  }
  const { headers } = req;

  // We turned off body parsing with Next.js so we could verify the
  // request source was Twitch. So we need to absorb the body now.
  const body = await webhookPayloadParser(req);
  console.log("2" + req, body);
  try {
    verifyRequestFromTwitch(req, body);
  } catch {
    return res.status(403).end();
  }

  const messageId = headers["twitch-eventsub-message-id"];
  const timestamp = headers["twitch-eventsub-message-timestamp"];

  // Test webhook log storing next push
  console.log(messageId, timestamp);

  // Store the record in the DB to make sure we avoid dups.
  const alreadySeen = !(await Supabase.trackRecievedTwitchWebhook(
    messageId,
    timestamp
  ));

  if (alreadySeen) {
    return res.end();
  }

  const contentType = headers["content-type"];

  if (contentType !== "application/json") {
    return res.status(400).end();
  }

  let bodyAsObj = {};

  try {
    bodyAsObj = JSON.parse(body);
  } catch {
    // The body should be JSON, if it isn't I don't know how to handle it
    // anyway.
    return res.status(400).end();
  }

  // Verification for new subscriptions
  if (
    headers["twitch-eventsub-message-type"] === "webhook_callback_verification"
  ) {
    const {
      challenge,
      subscription: {
        id,
        type,
        condition: { broadcaster_user_id },
      },
    } = bodyAsObj;

    const hook = await Supabase.doesUserHaveWebhook(
      { id: broadcaster_user_id },
      type
    );
    if (hook && hook.id === id) {
      return res.end(challenge);
    }

    return res.status(400).end();
  }
  
  // Handle Twith revoking a webhook
  if (headers["twitch-eventsub-message-type"] === "revocation") {
    const {
      subscription: { id },
    } = bodyAsObj;

    await Supabase.removeUserWebhookSubscription(id);

    return res.end();
  }

  // Finally handle the notification
  // N.B Will ignore any events while a stream is offline.
  await handleWebhookEvent(bodyAsObj);

  res.end();
};

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * N.B since we turned off body parsing we need to get the bytes from the body
 * stream and translate them into utf8 text.
 */
function webhookPayloadParser(req) {
  console.log("3" + req);
  return new Promise((resolve) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      resolve(Buffer.from(data).toString());
    });
  });
}

// verify header Twitch-Eventsub-Message-Signature
async function verifyRequestFromTwitch(req, body) {
  console.log("4" + req, body);
  const twitchMessageId = req.headers["twitch-eventsub-message-id"];
  const twitchMessageTimestamp = req.headers[
    "twitch-eventsub-message-timestamp"
  ];
  const twitchSignatureHeader = req.headers[
    "twitch-eventsub-message-signature"
  ];
  
  if (
    twitchMessageId == null ||
    twitchMessageTimestamp == null ||
    twitchSignatureHeader == null
  ) {
    throw new Error("Invalid request");
  }

  const message = twitchMessageId + twitchMessageTimestamp + body;
  const expectedSignature = sha256.hmac.hex(process.env.SECRET, message);

  if (twitchSignatureHeader !== `sha256=${expectedSignature}`) {
    throw new Error("Invalid request");
  }
}
