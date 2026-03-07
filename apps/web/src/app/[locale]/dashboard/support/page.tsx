import { getMetadata } from "~/lib/metadata";
import { SupportView } from "~/modules/dashboard/support/view";

export const generateMetadata = getMetadata({
  title: "dashboard:support.home.title",
  description: "dashboard:support.home.description",
});

export default function SupportPage() {
  return <SupportView />;
}
