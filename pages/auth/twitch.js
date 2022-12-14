import { useEffect } from "react";
import { useRouter } from "next/router";
import { until } from "@open-draft/until";

export default function TwitchOAuthCallback() {
  const router = useRouter();
  const { code, state } = router.query;

  useEffect(() => {
    if (typeof window !== undefined && code != null) {
      const state = localStorage.getItem("__twRw");
      const from = localStorage.getItem("__from");
      
      if (state != state) {
        // you cannot auth.
        return;
      }

      fetch(`/api/auth/callback/twitch?code=${code}`).then(async (response) => {
        if (response.ok) {
          const {error: parseError, data: user} = await until(() => response.json())
          
          if(parseError == null && user != null) {
            router.replace(`/u/${user.login}/` + (from ? from : ''));
            return;
          }

          router.replace("/");
        }
      });
    }
  }, [code, state]);

  return "Redirecting...";
}