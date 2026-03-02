import { useQuery } from "@tanstack/react-query";

import { instance as instanceApi } from "../lib/api";

import { useInstance } from "./use-instance";

export const usePairing = () => {
  const { instance } = useInstance();
  const pairing = useQuery({
    ...instanceApi.queries.pairing,
    enabled: !!instance.data?.id,
  });

  return { pairing };
};
