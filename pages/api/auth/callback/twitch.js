import { until } from "@open-draft/until";
import ms from "ms";
import * as Cookie from "cookie";

import * as Supabase from "../../../../lib/supabase";
import * as Twitch from "../../../../lib/twitch";
import { createUserWebhooks } from "../../../../utils/createUserWebhooks";

export default async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).end();
  }

  const { code } = req.query;

  const {error: authError, data: authResponse} = await until(() => Twitch.getOAuthToken(code));
  
  if (authError == null && authResponse.ok) {
    const { access_token } = await authResponse.json();

    const {error: userGetError, data: twitchUser} = await until(() => Twitch.getUser(access_token));
    if (userGetError == null && twitchUser != null) {
      const user = await Supabase.getUserById(twitchUser.id);

      if (user == null) {
        await Supabase.addNewUser(twitchUser);
        await createUserWebhooks(twitchUser);
      }

      res.setHeader("access-control-expose-headers", "Set-Cookie");
      res.setHeader("Set-Cookie", [
        Cookie.serialize("__twRw", JSON.stringify(twitchUser), {
          expires: new Date(Date.now() + ms("1y")),
          path: "/",
        }),
        Cookie.serialize("__twtk", JSON.stringify({ t: access_token }), {
          expires: new Date(Date.now() + ms("2d")),
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        }),
      ]);

      res.json(twitchUser);

      return;
    }
  }

  res.end();
};
