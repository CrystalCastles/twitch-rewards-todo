import * as Supabase from "../../../lib/supabase.js";

export default async (req, res) => {
  if (req.method == "POST") {
    const { userId, textColor, glowColor, kofiKey } = req.body;

    if (userId == null || (textColor == null && glowColor == null && kofiKey == null)) {
      return res.status(400).end();
    }

    if(textColor && glowColor) {
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
    } else if(kofiKey) {
      if (!(await Supabase.getUserConfig(userId))) {
        res.json(
          Supabase.addUserConfig(userId, {
            kofi_key: kofiKey,
          })
        );
      } else {
        res.json(
          Supabase.updateUserConfig(userId, {
            kofi_key: kofiKey,
          })
        );
      }
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
