import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

import { instance as instanceApi } from "../lib/api";

export const useInstance = () => {
  const { t } = useTranslation("dashboard");
  const router = useRouter();
  const instance = useQuery(instanceApi.queries.get);

  const deploy = useMutation({
    ...instanceApi.mutations.deploy,
    onSuccess: () => {
      toast.success(t("instance.deploy.success"));
      router.refresh();
    },
  });

  return { instance, deploy };
};
