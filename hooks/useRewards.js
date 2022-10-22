import { until } from "@open-draft/until";
import useSWR from "swr";

async function fetcher(route, login) {
  if(login == null) {
    throw new Error("Cannot fetch rewards without login.");
  }

  const { error: fetchError, data: response } = await until(() => fetch(`${route}?login=${login}`));

  if(fetchError != null || !response.ok) {
    return [];
  }

  const { error: parseError, data } = await until(() => response.json());

  if(parseError != null || data == null) {
    return [];
  }

  return data;
}

export function useRewards(login, options) {
  return useSWR(["/api/rewards/list", login], fetcher, {
    initialData: options?.initialData,
    refreshInterval: options?.refreshInterval,
  });
}