import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import styled from "styled-components";

import * as Twitch from "../lib/twitch";

export default function Home(props) {
  useEffect(() => {
    if (typeof window !== undefined) {
      localStorage.setItem("__twRw", props.state);
    }
  }, [props.state]);

  return (
    <LoginPage>
      <Button href={props.twitchAuthUrl}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          class="bi bi-twitch"
          viewBox="0 0 18 18"
        >
          <path d="M3.857 0 1 2.857v10.286h3.429V16l2.857-2.857H9.57L14.714 8V0H3.857zm9.714 7.429-2.285 2.285H9l-2 2v-2H4.429V1.143h9.142v6.286z" />
          <path d="M11.857 3.143h-1.143V6.57h1.143V3.143zm-3.143 0H7.571V6.57h1.143V3.143z" />
        </svg>
        Log in with Twitch
      </Button>
    </LoginPage>
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

const LoginPage = styled.div`
  margin: 1rem;
  overflow: auto;
`

const Button = styled.a`
  text-decoration: none;
  display: flex;
  align-items: center;
  appearance: button;
  backface-visibility: hidden;
  background-color: #9146ff;
  border-radius: 6px;
  border-width: 0;
  box-shadow: rgba(50, 50, 93, 0.1) 0 0 0 1px inset,
    rgba(50, 50, 93, 0.1) 0 2px 5px 0, rgba(0, 0, 0, 0.07) 0 1px 1px 0;
  box-sizing: border-box;
  color: #fff;
  cursor: pointer;
  font-family: -apple-system, system-ui, "Segoe UI", Roboto, "Helvetica Neue",
    Ubuntu, sans-serif;
  font-size: 100%;
  height: 44px;
  line-height: 1.15;
  outline: none;
  overflow: hidden;
  padding: 0 25px;
  position: relative;
  text-align: center;
  text-transform: none;
  transform: translateZ(0);
  transition: all 0.2s, box-shadow 0.08s ease-in;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  width: 200px;

  svg {
    position: relative;
    left: -2px;
    top: 2px;
    margin-right: 2px;
  }

  &:disabled {
    cursor: default;
  }


`;
