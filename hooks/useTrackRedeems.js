import { until } from "@open-draft/until";
import ms from "ms";
import useSWR from "swr";

async function fetcher(route, userId, streamId) {
  if (userId == null || streamId == null) {
    throw new Error("Fetch requirements are missing");
  }
  
  const { error: fetchError, data: response } = await until(() =>
    fetch(
      `${route}?userId=${userId}&streamId=${streamId}`
    )
  );

  if (fetchError != null || !response.ok) {
    return { count: 0 };
  }

  const { error: parseError, data } = await until(() => response.json());

  if (parseError != null || data == null) {
    return { count: 0 };
  }

  return data;
}

export function useTrackRedeems(userId, streamId, options) {
  const { data } = useSWR(
    ["/api/user/redeems", userId, streamId],
    fetcher,
    {
      initialData: options?.initialData,
    }
  );

  return [data?.count ?? 0, data?.events];
}
