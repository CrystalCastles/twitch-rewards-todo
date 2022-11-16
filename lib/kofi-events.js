import * as Supabase from "./supabase";
import { v4 as uuidv4 } from 'uuid';

export async function handleUserDonateEvent(event) {;
  
  const userId = event.user_id;
  const uuid = uuidv4();

  // const currentStream = await Supabase.getCurrentLiveStreamForUserId(userId);

  // if (currentStream != null) {
  // change streamId here and supabase, also change subscription callback
  return Supabase.addUserEvent(userId, 1, {
    id: event.from_name == "Ko-fi Team" ? uuid : event.message_id,
    event_user_login: event.from_name,
    event_user_name: event.from_name,
    event_user_input: event.message ? event.message : null,
    event_type: "kofi.donation",
    event_reward_title: "Donation",
    is_donation: true,
    donation_amount: event.amount + " " + event.currency
  });
  // }
}

const EVENT_HANDLERS = {
  "Donation": handleUserDonateEvent,
};

export function handleKofiWebhookEvent(data) {
  const { type } = data;

  const handler = EVENT_HANDLERS[type];

  if (handler != null) {
    // @ts-ignore There is a valid type error here, not sure I should fuddle with it?
    return handler(data);
  }

  return false;
}
