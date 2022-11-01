import Router from "next/router";
import * as Cookie from "cookie";
import { Fragment, useEffect, useRef, useState } from "react";
import { useTrackRedeems } from "../../../hooks/useTrackRedeems";
import { getAllUserRedeems, userRewardsUpdated } from "../../../lib/supabase";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { verifyUserToken } from "../../../lib/twitch";
import { GlobalHotKeys } from "react-hotkeys";

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
  const currentRedeem = updatedRedeem ? updatedRedeem[0] : null;
  const nextRedeems = updatedRedeem
    ? updatedRedeem.slice(1, updatedRedeem.length)
    : null;

  useEffect(() => {
    userRewardsUpdated(["/api/user/redeems", userId, streamId]);

    setHeight(ref?.current?.clientHeight);
    window.addEventListener("resize", getHeightSize);

    if (props.user == null) {
      Router.replace("/");
    }
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
  };

  // const clearRedeemsList = () => {
  //   fetch("/api/redeems/update", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ userId: props.user.id, redeemId: "all" }),
  //   }).then(async (response) => {
  //     if (response.ok) {
  //       const r = await response.json();
  //     }
  //   });
  // };

  const keyMap = {
    // CLEAR_ALL: "del",
    CLEAR_CURRENT: "backspace",
  };

  const handlers = {
    // CLEAR_ALL: () => clearRedeemsList(),
    CLEAR_CURRENT: () => markRedeemComplete(currentRedeem ? currentRedeem.id : null),
  };

  return (
    <GlobalHotKeys keyMap={keyMap} handlers={handlers} allowChanges={true}>
      <AnimatePresence>
        <List className="list">
          {currentRedeem && (
            <TopSection ref={ref}>
              <CurrentRedeem
                onClick={() => markRedeemComplete(currentRedeem.id)}
              >
                {currentRedeem.event_reward_title} from{" "}
                <span style={{ fontWeight: "bold" }}>
                  {currentRedeem.event_user_login}
                </span>
                {currentRedeem.event_user_input &&
                  `: ${currentRedeem.event_user_input}`}
              </CurrentRedeem>
              <p style={{ fontStyle: "italic" }}>Up next...</p>
            </TopSection>
          )}
          {currentRedeem && (
            <UpcomingList className="upcoming-list" height={height}>
              {nextRedeems.map((redeem, idx) => (
                <NextRedeem
                  key={idx}
                  className="next-redeem"
                  onClick={() => markRedeemComplete(redeem.id)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {redeem.event_reward_title} from{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {redeem.event_user_login}
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

// export async function getServerSideProps(context) {
//   const { twitchId } = context.params;

//   const redirectHome = () => {
//     context.res.statusCode = 302;
//     context.res.setHeader("Location", "/");
//   };

//   if (twitchId == null) {
//     redirectHome();

//     return { props: {} };
//   }

//   const user = await getUserByTwitchLogin(twitchId);

//   if (user == null || user.login != twitchId) {
//     redirectHome();

//     return { props: {} };
//   }

//   const streamId = 1; // await getCurrentLiveStreamForUserId(twitchId);
//   const redeems = await getAllUserRedeems(user.id, streamId);
//   return {
//     props: {
//       user,
//       redeems,
//     },
//   };
// }

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

  return {
    props: {
      user,
      redeems,
    },
  };
}

const List = styled(motion.div)`
  font-size: 1.5rem;
  color: #af87f5;
  text-shadow: 0 0 10px #af87f5, 0 0 10px #5c14db;
  word-wrap: break-word;
  white-space: normal;

  > * {
    padding-left: 5px;
    padding-right: 5px;
    padding-bottom: 5px;
  }

  & p {
    margin: 0.2rem auto;
  }
`;

const UpcomingList = styled(motion.div)`
  overflow-y: scroll;
  overscroll-behavior-y: contain;
  scroll-snap-type: y proximity;
  max-height: ${(props) => `calc(100vh - ${props.height}px)`};

  .next-redeem:first-child {
    scroll-snap-align: start;
  }

  .next-redeem:last-child {
    scroll-snap-align: end;
  }

  /* ===== Scrollbar CSS ===== */
  /* Firefox */
  scrollbar-width: auto;
  scrollbar-color: #af87f5 #000000;

  /* Chrome, Edge, and Safari */
  ::-webkit-scrollbar {
    width: 4px;
  }

  ::-webkit-scrollbar-track {
    display: none;
  }

  ::-webkit-scrollbar-thumb {
    background-color: #af87f5;
    border-radius: 5px;
    border: 2px none #ffffff;
  }
`;

const CurrentRedeem = styled(motion.div)`
  pointer-events: none;

  &:after {
    display: inline;
    content: "x";
    position: relative;
    color: palevioletred;
    text-shadow: 0 0 10px #af87f5, 0 0 10px #5c14db;
    background-color: transparent;
    border: transparent;
    font-size: 1em;
    bottom: 0.3rem;
    left: 0.3rem;
    pointer-events: all;
    cursor: pointer;
  }
`;

const NextRedeem = styled(motion.div)`
  &:active {
    pointer-events: none;
  }

  &:hover {
    &::after {
      display: inline;
      content: "x";
      position: relative;
      color: palevioletred;
      text-shadow: 0 0 10px #af87f5, 0 0 10px #5c14db;
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
