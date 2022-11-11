import * as Cookie from "cookie";
import { getUserConfig, listRewardsForUser } from "../../../lib/supabase";
import { verifyUserToken } from "../../../lib/twitch";
import { useForm } from "react-hook-form";
import { useRewards } from "../../../hooks/useRewards";
import { useRouter } from "next/router";
import { useActiveWebhooks } from "../../../hooks/useActiveWebhooks";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { until } from "@open-draft/until";
import { SketchPicker } from "react-color";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { recordKeyCombination } from "react-hotkeys";
import { useConfig } from "../../../hooks/useConfig";
import { TailSpin } from "react-loader-spinner";

export default function EditRewards(props) {
  const router = useRouter();
  const [textColor, setTextColor] = useState(
    props.config?.text_color ? props.config?.text_color : "#af87f5"
  );
  const [glowColor, setGlowColor] = useState(
    props.config?.glow_color ? props.config?.glow_color : "#af87f5"
  );
  const [loadingId, setLoadingId] = useState({});
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // const [clearCurrentBind, setClearCurrentBind] = useState(null);
  // const [clearAllBind, setClearAllBind] = useState(null);

  const { data: userConfig } = useConfig(props.user?.id, {
    initialData: props.config,
  });
  const { data: activeWebhooks = [], mutate: mutateActiveWebhooks } =
    useActiveWebhooks(props.user?.id);
  const { data, mutate } = useRewards(router.query.twitchId, {
    initialData: props.rewards,
  });

  useEffect(() => {
    if (userConfig) {
      setTextColor(userConfig?.text_color ? userConfig?.text_color : "#af87f5");
      setGlowColor(userConfig?.glow_color ? userConfig?.glow_color : "#af87f5");
    }
  }, [userConfig]);

  const activeRewards = props.rewards
    ? props.rewards.filter((reward) => reward.active).map((reward) => reward.id)
    : null;

  const { register, handleSubmit, reset } = useForm({
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

  const onSubmit = async (data, e) => {
    const { id } = e.target;
    setLoadingId((ids) => ({
      ...ids,
      [id]: true,
    }));
    fetch("/api/rewards/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then(async (response) => {
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 3000);
      }
      setLoadingId((ids) => ({
        ...ids,
        [id]: false,
      }));
    });
  };

  const createInitialRewards = (e) => {
    const { id } = e.target;
    setLoadingId((ids) => ({
      ...ids,
      [id]: true,
    }));
    fetch("/api/rewards/add", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    }).then(async (response) => {
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
        const r = await response.json();
        mutate((currentData) => [r, ...(currentData ?? [])], true);
        reset({ rewards: null });
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 3000);
      }
      setLoadingId((ids) => ({
        ...ids,
        [id]: false,
      }));
    });
  };

  const clearRedeemsList = (e) => {
    const { id } = e.target;
    setLoadingId((ids) => ({
      ...ids,
      [id]: true,
    }));
    fetch("/api/redeems/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: props.user.id, redeemId: "all" }),
    }).then(async (response) => {
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 3000);
      }
      setLoadingId((ids) => ({
        ...ids,
        [id]: false,
      }));
    });
  };

  const updateUserConfig = (e) => {
    const { id } = e.target;
    setLoadingId((ids) => ({
      ...ids,
      [id]: true,
    }));
    fetch("/api/user/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: props.user.id,
        textColor: textColor,
        glowColor: glowColor,
      }),
    }).then(async (response) => {
      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(true);
        setTimeout(() => {
          setError(false);
        }, 3000);
      }
      setLoadingId((ids) => ({
        ...ids,
        [id]: false,
      }));
    });
  };

  const handleTextColorChange = (color, event) => {
    setTextColor(color.hex);
  };

  const handleGlowColorChange = (color, event) => {
    setGlowColor(color.hex);
  };

  const spinner = (
    <TailSpin
      height="20"
      width="20"
      color="#4fa94d"
      ariaLabel="tail-spin-loading"
      radius="1"
      wrapperStyle={{}}
      wrapperClass=""
      visible={true}
    />
  );

  return (
    <Fragment>
      <AnimatePresence>
        {success && (
          <Success
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Successfully Submitted
          </Success>
        )}

        {error && <Error>Error, please try again</Error>}
      </AnimatePresence>
      <EditPage>
        {!hasRequiredWebhooks ? (
          <Button onClick={connectToUserStreamEvents} id={0}>
            {loadingId[0] ? spinner : "Connect twitch events"}
          </Button>
        ) : null}

        {hasRequiredWebhooks && (
          <Fragment>
            <p style={{ fontWeight: "bold" }}>Rewards Configuration:</p>
            <Rewards>
              <Button onClick={createInitialRewards} id={1}>
                {loadingId[1]
                  ? spinner
                  : "Fetch rewards list. Click if there is no list or the list is outdated. This will reset your selected rewards."}
              </Button>

              <Button onClick={clearRedeemsList} id={2}>
                {loadingId[2]
                  ? spinner
                  : "Clear redeems (mark all as completed)."}
              </Button>

              <p>
                Select the rewards that you want their redeems to be shown and
                click submit:
              </p>
              <form
                id={3}
                onSubmit={(e) => {
                  handleSubmit(onSubmit)(e);
                }}
              >
                <ul>
                  {data ? (
                    data?.map((reward, idx) => (
                      <li key={idx}>
                        <input
                          placeholder={reward.reward}
                          name={reward.reward}
                          type="checkbox"
                          value={reward.id}
                          id={reward.id}
                          {...register("rewards", { required: true })}
                        />
                        <label htmlFor={reward.id}>{reward.reward}</label>
                      </li>
                    ))
                  ) : (
                    <TailSpin
                      height="50"
                      width="50"
                      color="#4fa94d"
                      ariaLabel="tail-spin-loading"
                      radius="1"
                      wrapperStyle={{}}
                      wrapperClass=""
                      visible={true}
                    />
                  )}
                </ul>
                <Button type="submit" id={3}>
                  {loadingId[3] ? spinner : "Submit"}
                </Button>
              </form>
            </Rewards>

            <p style={{ fontWeight: "bold" }}>User Configuration:</p>
            <UserConfig>
              <ColorPickers>
                <TextColor>
                  <p>Text Color</p>
                  <SketchPicker
                    color={textColor}
                    onChange={handleTextColorChange}
                  />
                </TextColor>

                <GlowColor>
                  <p>Glow Color</p>
                  <SketchPicker
                    color={glowColor}
                    onChange={handleGlowColorChange}
                  />
                </GlowColor>
              </ColorPickers>
              <PreviewTextWhite textcolor={textColor} glowcolor={glowColor}>
                <p>
                  Preview Of Text:{" "}
                  <span style={{ fontWeight: "bold" }}>Testing</span>
                </p>
              </PreviewTextWhite>

              <PreviewTextBlack textcolor={textColor} glowcolor={glowColor}>
                <p>
                  Preview Of Text:{" "}
                  <span style={{ fontWeight: "bold" }}>Testing</span>
                </p>
              </PreviewTextBlack>
              {/* <p>Clear Top Redeem Keybind</p>

            <p>Clear All Redeems Keybind</p> */}
              <Button onClick={updateUserConfig} id={4}>
                {loadingId[4] ? spinner : "Submit"}
              </Button>
            </UserConfig>
          </Fragment>
        )}
      </EditPage>
    </Fragment>
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
  const config = await getUserConfig(user);

  return {
    props: {
      user,
      rewards,
      config,
    },
  };
}

const EditPage = styled(motion.div)`
  overflow: auto;
  overscroll-behavior-y: contain;
  height: 100vh;
  margin: 0 auto;
  padding: 1rem;
  position: fixed;
  top: 0;
`;

const Rewards = styled(motion.div)`
  & li {
    list-style: none;
  }
`;

const UserConfig = styled(motion.div)``;

const PreviewTextWhite = styled(motion.div)`
  background-color: #fff;
  outline: 1px solid gray;
  width: 20rem;

  & p {
    text-align: center;
    color: ${(props) => `${props.textcolor}`};
    text-shadow: ${(props) =>
      `0 0 10px ${props.glowcolor}, 0 0 10px ${props.glowcolor}`};
  }
`;

const PreviewTextBlack = styled(motion.div)`
  background-color: #000;
  width: 20rem;
  & p {
    text-align: center;
    color: ${(props) => `${props.textcolor}`};
    text-shadow: ${(props) =>
      `0 0 10px ${props.glowcolor}, 0 0 10px ${props.glowcolor}`};
  }
`;

const Success = styled(motion.div)`
  position: fixed;
  text-align: center;
  left: 50%;
  transform: translate(-50%, 0);
  color: white;
  background-color: #4bb543;
  padding: 1.3rem 3rem;
  z-index: 99;
`;

const Error = styled(motion.div)`
  position: fixed;
  text-align: center;
  left: 50%;
  transform: translate(-50%, 0);
  color: white;
  background-color: #ed4337;
  padding: 1.3rem 3rem;
  z-index: 99;
`;

const TextColor = styled(motion.div)``;
const GlowColor = styled(motion.div)``;
const ColorPickers = styled(motion.div)`
  display: flex;
  > * {
    margin: 0 2rem;
  }
`;

const Button = styled(motion.button)`
  align-items: center;
  background-color: #FFFFFF;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: .25rem;
  box-shadow: rgba(0, 0, 0, 0.1) 0 1px 3px 0;
  box-sizing: border-box;
  color: rgba(0, 0, 0, 0.85);
  cursor: pointer;
  display: inline-flex;
  font-family: system-ui,-apple-system,system-ui,"Helvetica Neue",Helvetica,Arial,sans-serif;
  font-size: 16px;
  font-weight: 600;
  justify-content: center;
  line-height: 1.25;
  margin: .3rem;
  height: 3rem;
  padding: calc(.875rem - 1px) calc(1.5rem - 1px);
  position: relative;
  text-decoration: none;
  transition: all 250ms;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  vertical-align: baseline;
  min-width: 7rem;
}

&:hover,
&:focus {
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: rgba(0, 0, 0, 0.1) 0 4px 12px;
  color: rgba(0, 0, 0, 0.65);
}

&:hover {
  transform: translateY(-1px);
}

&:active {
  background-color: #F0F0F1;
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: rgba(0, 0, 0, 0.06) 0 2px 4px;
  color: rgba(0, 0, 0, 0.65);
  transform: translateY(0);
}
`;
