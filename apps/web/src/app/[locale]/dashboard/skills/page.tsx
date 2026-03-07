import { getMetadata } from "~/lib/metadata";
import { SkillsView } from "~/modules/dashboard/skills/view";

export const generateMetadata = getMetadata({
  title: "dashboard:skills.title",
  description: "dashboard:skills.description",
});

export default function SkillsPage() {
  return <SkillsView />;
}
