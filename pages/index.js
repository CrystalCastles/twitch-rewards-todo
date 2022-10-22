import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

import * as Twitch from "../lib/twitch";

export default function Home(props) {
  useEffect(() => {
    if (typeof window !== undefined) {
      localStorage.setItem("__twRw", props.state);
    }
  }, [props.state]);
  
  return (
    <a href={props.twitchAuthUrl}>
      <button>Log in with Twitch</button>
    </a>
  );
}

export async function getServerSideProps() {
  const state = uuidv4();

  return {
    props: {
      twitchAuthUrl: Twitch.getOAuthUrl(state),
      state,
    },
  };
}
