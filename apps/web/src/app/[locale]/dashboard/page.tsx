import { getMetadata } from "~/lib/metadata";
import { ViewInstance } from "~/modules/dashboard/instance/view";

export const generateMetadata = getMetadata({
  title: "dashboard:instance.home.title",
  description: "dashboard:instance.home.description",
});

export default function DashboardIndex() {
  return <ViewInstance />;
}
