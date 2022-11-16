import { handleKofiWebhookEvent } from "../../../../lib/kofi-events";
import * as Supabase from '../../../../lib/supabase';

export default async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  let userConfig = await Supabase.getUserConfig(null, req.query.id);
  
  if(!userConfig) {
    console.log("No user with this key exists.");
    return res.status(200).end();
  }

  let data = JSON.parse(req.body.data);

  if(data.verification_token !== process.env.KOFI_TOKEN) {
    return res.status(400).end();
  }
  
  if(!data.is_public || data.type !== "Donation") {
    console.log("Invalid parameters");
    return res.status(200).end();
  }

  let userId = userConfig.user_id;

  let newData = {};
  newData.user_id = userId;
  newData.message_id = data.message_id;
  newData.type = data.type;
  newData.from_name = data.from_name;
  newData.message = data.message;
  newData.amount = data.amount;
  newData.currency = data.currency;

  await handleKofiWebhookEvent(newData);

  return res.status(200).end();
}