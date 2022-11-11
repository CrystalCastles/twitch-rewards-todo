import * as Supabase from "../../../lib/supabase.js";

export default async (req, res) => {
  if (req.method == "POST") {
    const { userId, textColor, glowColor } = req.body;

    if (userId == null || textColor == null || glowColor == null) {
      return res.status(400).end();
    }

    if (!(await Supabase.getUserConfig(userId))) {
      res.json(
        Supabase.addUserConfig(userId, {
          text_color: textColor,
          glow_color: glowColor,
        })
      );
    } else {
      res.json(
        Supabase.updateUserConfig(userId, {
          text_color: textColor,
          glow_color: glowColor,
        })
      );
    }
  } else if (req.method == "GET") {

    const { userId } = req.query;
    if (userId == null) {
      return res.status(400).end();
    }

    res.json(await Supabase.getUserConfig(userId));
  } else {
    return res.status(405).end();
  }
};
