import { until } from "@open-draft/until";
import useSWR from "swr";

async function fetcher(route, userId) {
  if (userId == null) {
    throw new Error("Require user id to fetch");
  }

  const {error: fetchError, data: response} = await until(() =>
    fetch(`${route}?userId=${userId}`)
  );

  if (fetchError != null || !response.ok) {
    return [];
  }

  const {error: parseError, data} = await until(() => response.json());

  if (parseError != null || data == null) {
    return [];
  }

  return data;
}

export function useConfig(userId, options) {
  return useSWR(["/api/user/config", userId], fetcher, {
    initialData: options?.initialData,
  });
}