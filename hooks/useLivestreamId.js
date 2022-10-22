import { until } from "@open-draft/until";
import { useState, useEffect } from "react";
import useSWR from "swr";

async function fetcher(route, userId) {
  if (userId == null) {
    throw new Error("Require user id to fetch");
  }

  const {error: fetchError, data: response} = await until(() =>
    fetch(`${route}?id=${userId}`)
  );

  if (fetchError != null || !response.ok) {
    return undefined;
  }

  const {error: parseError, data} = await until(() => response.json());

  if (parseError != null || data == null) {
    return undefined;
  }

  return data;
}

export function useLiveStreamId(userId) {
  const [streamId, setStreamId] = useState();
  const { data } = useSWR(["/api/user/stream", userId], fetcher);

  useEffect(() => {
    if(data != null) {
      setStreamId(data.id)
    }
  }, [data])
  return streamId;
}