import { getMetadata } from "~/lib/metadata";
import { AdminTicketsView } from "~/modules/admin/tickets/view";

export const generateMetadata = getMetadata({
  title: "dashboard:admin.tickets.home.title",
  description: "dashboard:admin.tickets.home.description",
});

export default function AdminTicketsPage() {
  return <AdminTicketsView />;
}
