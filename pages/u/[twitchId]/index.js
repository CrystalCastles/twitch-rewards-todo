import Router from "next/router";
import * as Cookie from "cookie";
import { Fragment, useContext, useEffect, useState } from "react";
import { useTrackRedeems } from "../../../hooks/useTrackRedeems";
import {
  getUserByTwitchLogin,
  listRewardsForTwitchLogin,
  getAllUserRedeems,
} from "../../../lib/supabase";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { verifyUserToken } from "../../../lib/twitch";

export default function UserPage(props) {
  const streamId = 1; //useLiveStreamId(props.user?.id);
  const [currentRedeemCount, redeems] = useTrackRedeems(
    props.user?.id,
    streamId
  );
  const [updatedRedeem, setUpdatedRedeem] = useState(props.redeems?.events);
 
  useEffect(() => {
    if (props.user == null) {
      Router.replace("/");
    }
  }, []);

  useEffect(() => {
    if (redeems) {
      setUpdatedRedeem(redeems);
    }
  }, [redeems]);

  const currentRedeem = updatedRedeem ? updatedRedeem[0] : null;
  const nextRedeems = updatedRedeem
    ? updatedRedeem.slice(1, updatedRedeem.length)
    : null;

  const markRedeemComplete = (redeemId) => {
    fetch("/api/redeems/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: props.user.id, redeemId: redeemId }),
    });
  };

  return (
    <Fragment>
      {currentRedeem && (
        <List className="list">
          <CurrentRedeem onClick={() => markRedeemComplete(currentRedeem.id)}>
            {currentRedeem.event_reward_title} from{" "}
            <span style={{fontWeight: "bold"}}>{currentRedeem.event_user_login}</span>
            {currentRedeem.event_user_input &&
            `: ${currentRedeem.event_user_input}`}
          </CurrentRedeem>
          {/* <Button onClick={() => markRedeemComplete(currentRedeem.id)}>x</Button> */}

          <p style={{fontStyle: "italic"}}>Up next...</p>
          <UpcomingList className="upcoming-list">
            {nextRedeems.map((redeem, idx) => (
              <p key={idx}>
                {redeem.event_reward_title} from <span style={{fontWeight: "bold"}}>{redeem.event_user_login}</span>
                {redeem.event_user_input &&
                  `:  ${redeem.event_user_input}`}
              </p>
            ))}
          </UpcomingList>
        </List>
      )}
      {/* {!currentRedeem && <p>All caught up</p>} */}
    </Fragment>
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
};

const Button = styled.button`
  position: relative;
  color: palevioletred;
  text-shadow: 0 0 10px #af87f5, 0 0 10px #5c14db;
  background-color: transparent;
  border: transparent;
  font-size: 1em;
  bottom: .3rem;
  cursor: pointer;
`;

const List = styled(motion.div)`
  width: 800px;
  font-size: 1.5rem;
  color: #af87f5;
  text-shadow: 0 0 10px #af87f5, 0 0 10px #5c14db;
  word-wrap: break-word;
  white-space: normal;

  > * {
    padding-left: 10px;
  }
  
  & p {
    margin: 0 auto;
  }
`;

const UpcomingList = styled(motion.div)`
  height: 200px;
  overflow-y: scroll;
  scroll-behavior: smooth;

  ::-webkit-scrollbar {
    display: none;
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
    bottom: .3rem;
    left: .3rem;
    pointer-events: all;
    cursor: pointer;
  }
`;
