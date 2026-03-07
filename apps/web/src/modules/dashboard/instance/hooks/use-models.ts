import { useQuery } from "@tanstack/react-query";

import { instance as instanceApi } from "../lib/api";

export const useModels = () => {
  return useQuery(instanceApi.queries.models);
};
