import { until } from "@open-draft/until";

import { getUserFromCookies } from "../../../utils/getUserFromCookies";
import { createUserWebhooks } from "../../../utils/createUserWebhooks";

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const {error: authorizationError, data: user} = await until(() =>
    getUserFromCookies(req.cookies)
  );

  if (authorizationError != null || user == null || user.token == null) {
    return res.status(401).end();
  }

  const success = await createUserWebhooks(user);

  if (!success) {
    return res.status(500).end();
  }

  res.end();
};