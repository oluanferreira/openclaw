import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTranslation } from "@workspace/i18n";

import { skills as skillsApi } from "../lib/api";

export const useSkills = () => {
  const { t } = useTranslation("dashboard");
  const queryClient = useQueryClient();

  const skills = useQuery(skillsApi.queries.list);

  const toggleSkill = useMutation({
    mutationFn: ({
      skillName,
      enabled,
      credentials,
    }: {
      skillName: string;
      enabled?: boolean;
      credentials?: Record<string, string>;
    }) => skillsApi.toggleSkill(skillName, { enabled, credentials }),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries(skillsApi.queries.list);
      toast.success(
        t(
          variables.enabled
            ? "skills.notifications.enabled"
            : "skills.notifications.disabled",
          { name: variables.skillName },
        ),
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { skills, toggleSkill };
};
