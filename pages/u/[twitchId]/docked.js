import Router from "next/router";
import * as Cookie from "cookie";
import { useEffect, useRef, useState } from "react";
import { useTrackRedeems } from "../../../hooks/useTrackRedeems";
import {
  getAllUserRedeems,
  getUserConfig,
  userRewardsUpdated,
} from "../../../lib/supabase";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { verifyUserToken } from "../../../lib/twitch";
import { GlobalHotKeys } from "react-hotkeys";
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export default function UserPage(props) {
  const [height, setHeight] = useState(0);
  const ref = useRef(null);
  const getHeightSize = () => {
    const newHeight = ref?.current?.clientHeight;
    return setHeight(newHeight);
  };

  const userId = props.user?.id;
  const streamId = 1; //useLiveStreamId(props.user?.id);

  const [currentRedeemCount, redeems] = useTrackRedeems(userId, streamId);
  const [updatedRedeem, setUpdatedRedeem] = useState(props.redeems?.events);
  const currentRedeems = updatedRedeem ? updatedRedeem : null;

  useEffect(() => {
    userRewardsUpdated(["/api/user/redeems", userId, streamId]);

    if (props.user == null) {
      Router.replace("/");
    }

    setHeight(ref?.current?.clientHeight);
    window.addEventListener("resize", getHeightSize);

    return () => window.removeEventListener("resize", getHeightSize);
  }, []);

  useEffect(() => {
    if (redeems) {
      setUpdatedRedeem(redeems);
    }
  }, [currentRedeemCount]);

  const markRedeemComplete = (redeemId) => {
    if (redeemId) {
      fetch("/api/redeems/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId, redeemId: redeemId }),
      }).then(async (response) => {
        if (response.ok) {
          const r = await response.json();
        }
      });
    }
  };

  const clearRedeemsList = () => {
    fetch("/api/redeems/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: props.user.id, redeemId: "all" }),
    }).then(async (response) => {
      if (response.ok) {
        setUpdatedRedeem([]);
        const r = await response.json();
      }
    });
  };

  const keyMap = {
    CLEAR_ALL: "del",
    CLEAR_CURRENT: "backspace",
  };

  const handlers = {
    CLEAR_ALL: () => clearRedeemsList(),
    CLEAR_CURRENT: () =>
      markRedeemComplete(
        currentRedeems ? currentRedeems[currentRedeems.length - 1].id : null
      ),
  };

  return (
    <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges={true}>
      <AnimatePresence>
        <Header ref={ref}>Twitch Redeems & Kofi Donations Feed</Header>
        <List height={height}>
          {currentRedeems
            ?.slice(0)
            .reverse()
            .map((redeem) => (
              <RedeemWrapper
                key={redeem.id}
                className={`${
                  redeem.is_donation ? "kofi-donation" : "points-redeem"
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Redeem onClick={() => markRedeemComplete(redeem.id)}>
                  <TimeSince>{moment(redeem.created_at).fromNow()}</TimeSince>
                  <CompleteButton>x</CompleteButton>
                  <Title>
                    <span style={{ fontWeight: "bold" }}>
                      {redeem.event_user_name}
                    </span>
                    {redeem.is_donation ? " donated" : " redeemed"}{" "}
                    {!redeem.is_donation && redeem.event_reward_title}{" "}
                    {redeem.is_donation && redeem.donation_amount + "!"}
                  </Title>
                  <Message>
                    {redeem.event_user_input && redeem.event_user_input}
                  </Message>
                </Redeem>
              </RedeemWrapper>
            ))}
        </List>
      </AnimatePresence>
    </GlobalHotKeys>
  );
}

export async function getServerSideProps({ params, req, res }) {
  const {
    headers: { cookie },
  } = req;

  const redirectHome = () => {
    res.statusCode = 302;
    res.setHeader("Location", `/?from=docked`);
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

  const streamId = 1; // await getCurrentLiveStreamForUserId(twitchId);
  const redeems = await getAllUserRedeems(user.id, streamId);
  const config = await getUserConfig(user);

  return {
    props: {
      user,
      redeems,
      config,
    },
  };
}

const List = styled(motion.div)`
  background-color: #110b21;
  font-size: 1.1rem;
  color: #d8d3e0;
  word-wrap: break-word;
  white-space: normal;
  overflow-y: auto;
  overflow-x: hidden;
  height: ${(props) => `calc(100vh - ${props.height}px)`};

  /* ===== Scrollbar CSS ===== */
  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: black;

  /* Chrome, Edge, and Safari */
  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    display: none;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #8674a6;
    border-radius: 5px;
    border: 2px none #ffffff;
  }
`;

const Redeem = styled(motion.div)`
  pointer-events: none;
  margin: 0;
  padding: 0.7rem 0.5rem;
`;

const RedeemWrapper = styled(motion.div)`
  border-top: 1px solid #d8d3e0;

  &:first-child {
    border-top: none;
  }

  &.kofi-donation {
    animation: pulse 2s infinite;
    background-color: white;
    @keyframes pulse {
      0% {
        background-color: rgba(255, 255, 255, 0.15);
      }

      70% {
        background-color: rgba(255, 255, 255, 0);
      }

      100% {
        background-color: rgba(255, 255, 255, 0.15);
      }
    }
  }
`;

const Header = styled(motion.div)`
  background-color: #0b061a;
  color: #8674a6;
  font-size: .8rem;
  padding: 0.5rem;
`;

const Message = styled(motion.div)`
  color: #888294;
`;

const Title = styled(motion.div)`
`;

const TimeSince = styled(motion.div)`
  display: inline;
  color: #888294;
`

const CompleteButton = styled(motion.div)`
  display: inline;
  position: relative;
  float:right;
  right: 0;
  color: #8674a6;
  font-size: 1em;
  pointer-events: all;
  cursor: pointer;
`