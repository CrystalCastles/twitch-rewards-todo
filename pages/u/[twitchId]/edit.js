import * as Cookie from "cookie";
import { listRewardsForUser } from "../../../lib/supabase";
import { verifyUserToken } from "../../../lib/twitch";
import { useForm } from "react-hook-form";
import { useRewards } from "../../../hooks/useRewards";
import { useRouter } from "next/router";
import { useActiveWebhooks } from "../../../hooks/useActiveWebhooks";
import { Fragment, useCallback, useMemo, useState } from "react";
import { until } from "@open-draft/until";
import { SketchPicker } from "react-color";

export default function EditRewards(props) {
  const router = useRouter();
  // const [textColor, setTextColor] = useState("#af87f5");
  // const [glowColor, setGlowColor] = useState("#5c14db");

  const { data: activeWebhooks = [], mutate: mutateActiveWebhooks } =
    useActiveWebhooks(props.user?.id);
  const { data, mutate } = useRewards(router.query.twitchId, {
    initialData: props.rewards,
  });

  const activeRewards = props.rewards
    ? props.rewards.filter((reward) => reward.active).map((reward) => reward.id)
    : null;

  const { register, handleSubmit } = useForm({
    defaultValues: { rewards: activeRewards },
  });

  const hasRequiredWebhooks = useMemo(() => {
    return (
      activeWebhooks.filter((wh) =>
        [
          "stream.online",
          "stream.offline",
          "channel.channel_points_custom_reward.add",
          "channel.channel_points_custom_reward.update",
          "channel.channel_points_custom_reward.remove",
          "channel.channel_points_custom_reward_redemption.add",
          "channel.channel_points_custom_reward_redemption.update",
        ].includes(wh.sub_type)
      ).length === 7
    );
  }, [activeWebhooks]);

  const connectToUserStreamEvents = useCallback(async () => {
    const { error: connectError, data: response } = await until(() =>
      fetch("/api/webhooks/connect", { method: "POST" })
    );
    if (connectError != null || !response.ok) {
      console.error("Oops, couldn't connect you to twitch events. Try again.");
      return;
    }
    mutateActiveWebhooks((whs) => whs, true);
  }, []);
  const onSubmit = async (data) => {
    fetch("/api/rewards/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  };

  const createInitialRewards = () => {
    fetch("/api/rewards/add", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then(async (response) => {
      if (response.ok) {
        const r = await response.json();
        mutate((currentData) => [r, ...(currentData ?? [])], true);
      }
    });
  };

  const clearRedeemsList = () => {
    fetch("/api/redeems/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: props.user.id, redeemId: "all" }),
    });
  };

  // const handleTextColorChange = (color, event) => {
  //   setTextColor(color.hex);
  // };

  // const handleGlowColorChange = (color, event) => {
  //   setGlowColor(color.hex);
  // };

  return (
    <div>
      {!hasRequiredWebhooks ? (
        <button onClick={connectToUserStreamEvents}>
          Connect twitch events
        </button>
      ) : null}

      {hasRequiredWebhooks && (
        <Fragment>
          <button onClick={createInitialRewards}>
            Fetch rewards list. Click if there is no list or the list is
            outdated. This will reset your selected rewards.
          </button>

          <button onClick={clearRedeemsList}>
            Clear redeems (mark all as completed).
          </button>

          <p>
            Select the rewards that you want their redeems to be shown and click
            submit:
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ul>
              {data?.map((reward, idx) => (
                <li key={idx}>
                  <label htmlFor={reward.id}>{reward.reward}</label>
                  <input
                    placeholder={reward.reward}
                    name={reward.reward}
                    type="checkbox"
                    value={reward.id}
                    id={reward.id}
                    {...register("rewards", { required: true })}
                  />
                </li>
              ))}
            </ul>
            <input type="submit" />
          </form>
            {/* <p>Text Color (#af87f5 default)</p>
            <SketchPicker
              color={textColor}
              onChangeComplete={handleTextColorChange}
            />

            <p>Glow Color (#5c14db default)</p>
            <SketchPicker
              color={glowColor}
              onChangeComplete={handleGlowColorChange}
            /> */}
        </Fragment>
      )}
    </div>
  );
}

export async function getServerSideProps({ params, req, res }) {
  const {
    headers: { cookie },
  } = req;
  const redirectHome = () => {
    res.statusCode = 302;
    res.setHeader("Location", "/");
  };

  if (cookie == null) {
    redirectHome();
    return { props: {} };
  }

  if (params?.twitchId == null) {
    redirectHome();

    return { props: {} };
  }

  const { __twRw: userString, __twtk } = Cookie.parse(cookie);
  let user = null;
  try {
    const { t } = JSON.parse(__twtk);
    const login = await verifyUserToken(t);
    if (params.twitchId !== login) {
      redirectHome();
      return { props: {} };
    }
    user = JSON.parse(userString);
  } catch {
    // Do nothing it's all good.
  }
  if (user == null) {
    redirectHome();
    return { props: {} };
  }
  const rewards = await listRewardsForUser(user);

  return {
    props: {
      user,
      rewards,
    },
  };
}
