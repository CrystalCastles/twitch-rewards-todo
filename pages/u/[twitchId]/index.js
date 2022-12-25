import Router from "next/router";
import * as Cookie from "cookie";
import { useEffect, useRef, useState } from "react";
import { useTrackRedeems } from "../../../hooks/useTrackRedeems";
import { getAllUserRedeems, getUserConfig, userRewardsUpdated } from "../../../lib/supabase";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { verifyUserToken } from "../../../lib/twitch";
import { GlobalHotKeys } from "react-hotkeys";
import { useConfig } from "../../../hooks/useConfig";

export default function UserPage(props) {
  const [textColor, setTextColor] = useState(props.config?.text_color ? props.config?.text_color : '#af87f5');
  const [glowColor, setGlowColor] = useState(props.config?.glow_color ? props.config?.glow_color : '#af87f5');
  // const [clearCurrentBind, setClearCurrentBind] = useState(null);
  // const [clearAllBind, setClearAllBind] = useState(null);
  const [height, setHeight] = useState(0);
  const ref = useRef(null);

  const getHeightSize = () => {
    const newHeight = ref?.current?.clientHeight;
    return setHeight(newHeight);
  };
  const userId = props.user?.id;
  const streamId = 1; //useLiveStreamId(props.user?.id);

  const { data: userConfig } = useConfig(props.user?.id, {
    initialData: props.config
  });

  useEffect(() => {
    if(userConfig) {
      setTextColor(userConfig?.text_color ? userConfig?.text_color : '#af87f5');
      setGlowColor(userConfig?.glow_color ? userConfig?.glow_color : '#af87f5');
    }
  }, [userConfig]);
  
  const [currentRedeemCount, redeems] = useTrackRedeems(userId, streamId);
  const [updatedRedeem, setUpdatedRedeem] = useState(props.redeems?.events);
  const currentRedeem = updatedRedeem ? updatedRedeem[0] : null;
  const nextRedeems = updatedRedeem
    ? updatedRedeem.slice(1, updatedRedeem.length)
    : null;

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
    if(redeemId) {
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
    
    // Get the height of the top section after X seconds. Bad implementation, change later when I figure it out.
    setTimeout(() => {
      setHeight(ref?.current?.clientHeight);
    }, 1000);
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
    CLEAR_CURRENT: () => markRedeemComplete(currentRedeem ? currentRedeem.id : null),
  };

  return (
    <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges={true}>
      <AnimatePresence>
        <List className="list" textcolor={textColor} glowcolor={glowColor}>
          {currentRedeem && (
            <TopSection ref={ref}>
              <CurrentRedeem
                className={(currentRedeem.is_donation || currentRedeem.event_reward_title.toLowerCase() == "trigger word redeem") && "premium"}
                onClick={() => markRedeemComplete(currentRedeem.id)}
              >
                {currentRedeem.is_donation && currentRedeem.donation_amount} {currentRedeem.event_reward_title} from{" "}
                <span style={{ fontWeight: "bold" }}>
                  {currentRedeem.event_user_name}
                </span>
                {currentRedeem.event_user_input &&
                  `: ${currentRedeem.event_user_input}`}
              </CurrentRedeem>
              <p style={{ fontStyle: "italic", marginBottom: "0" }}>Up next...</p>
            </TopSection>
          )}
          {currentRedeem && (
            <UpcomingList className="upcoming-list" height={height} textcolor={textColor} glowcolor={glowColor}>
              {nextRedeems.map((redeem, idx) => (
                <NextRedeem
                  key={idx}
                  className={`${(redeem.is_donation || redeem.event_reward_title.toLowerCase() == "trigger word redeem") ? "premium" : "points-redeem"} next-redeem`}
                  onClick={() => markRedeemComplete(redeem.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {redeem.is_donation && redeem.donation_amount} {redeem.event_reward_title} from{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {redeem.event_user_name}
                  </span>
                  {redeem.event_user_input && `:  ${redeem.event_user_input}`}
                </NextRedeem>
              ))}
              {nextRedeems.length == 0 && <p>No redeems in queue</p>}
            </UpcomingList>
          )}
          {!currentRedeem && <NoRedeems>No redeems in queue</NoRedeems>}
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

  const streamId = 1; // await getCurrentLiveStreamForUserId(twitchId);
  const redeems = await getAllUserRedeems(user.id, streamId);
  const config = await getUserConfig(user);

  return {
    props: {
      user,
      redeems,
      config
    },
  };
}

const List = styled(motion.div)`
  font-size: 1.5rem;
  color: ${(props) => `${props.textcolor}`};
  text-shadow: ${(props) => `0 0 10px ${props.glowcolor}, 0 0 10px ${props.glowcolor}`}; 
  word-wrap: break-word;
  white-space: normal;

  > * {
    padding: 5px;
  }

  & p {
    margin: .3rem auto;
  }

  & .premium {
	  animation: pulse 2s infinite;
    padding: .3rem;
    border-radius: .3rem;
    @keyframes pulse {
      0% {
        background-color: rgba(255, 255, 255, 0.2);
      }
    
      70% {
        background-color: rgba(255, 255, 255, 0);
      }
    
      100% {
        background-color: rgba(255, 255, 255, 0.2);
      }
    }
  }
`;

const UpcomingList = styled(motion.div)`
  overflow-y: scroll;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
  scroll-snap-type: y proximity;
  max-height: ${(props) => `calc(100vh - ${props.height}px)`};

  .next-redeem:first-child {
    margin-top: 0;
    scroll-snap-align: start;
  }

  .next-redeem:last-child {
    margin-bottom: 0;
    scroll-snap-align: end;
  }

  /* ===== Scrollbar CSS ===== */
  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: ${(props) => `${props.textcolor} #000000`};

  /* Chrome, Edge, and Safari */
  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    display: none;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${(props) => `${props.textcolor}`};
    border-radius: 5px;
    border: 2px none #ffffff;
  }
`;

const CurrentRedeem = styled(motion.p)`
  pointer-events: none;

  &:after {
    display: inline;
    content: "x";
    position: relative;
    color: palevioletred;
    text-shadow: ${(props) => `0 0 10px ${props.glowcolor}, 0 0 10px ${props.glowcolor}`}; 
    background-color: transparent;
    border: transparent;
    font-size: 1em;
    bottom: 0.3rem;
    left: 0.3rem;
    pointer-events: all;
    cursor: pointer;
  }
`;

const NextRedeem = styled(motion.p)`
  &:active {
    pointer-events: none;
  }

  &:hover {
    &::after {
      display: inline;
      content: "x";
      position: relative;
      color: palevioletred;
      text-shadow: ${(props) => `0 0 10px ${props.glowcolor}, 0 0 10px ${props.glowcolor}`}; 
      background-color: transparent;
      border: transparent;
      font-size: 1em;
      bottom: 0.3rem;
      left: 0.3rem;
      pointer-events: all;
      cursor: pointer;
    }
  }
`;

const TopSection = styled(motion.div)``;

const NoRedeems = styled(motion.div)``;
