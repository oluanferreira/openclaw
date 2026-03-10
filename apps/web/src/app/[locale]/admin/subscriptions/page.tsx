import { AdminSubscriptions } from "~/modules/admin/view/subscriptions";
import {
  DashboardHeader,
  DashboardHeaderTitle,
  DashboardHeaderDescription,
} from "~/modules/common/layout/dashboard/header";

export default function AdminSubscriptionsPage() {
  return (
    <>
      <DashboardHeader>
        <div>
          <DashboardHeaderTitle>Assinaturas</DashboardHeaderTitle>
          <DashboardHeaderDescription>
            Gerencie assinaturas, visualize faturas e acompanhe o status de
            cobrança.
          </DashboardHeaderDescription>
        </div>
      </DashboardHeader>
      <AdminSubscriptions />
    </>
  );
}
