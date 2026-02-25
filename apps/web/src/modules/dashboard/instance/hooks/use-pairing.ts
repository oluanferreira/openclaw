import { useQuery } from "@tanstack/react-query";

import { instance as instanceApi } from "../lib/api";

export const usePairing = () => {
  const pairing = useQuery(instanceApi.queries.pairing);

  return { pairing };
};
