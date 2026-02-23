import { Card } from "@workspace/ui-web/card";

import {
  DeployInstanceForm,
  DeployInstanceFormFooter,
  DeployInstanceFormNote,
  DeployInstanceSubmitButton,
} from "~/modules/dashboard/instance/deploy/form";

export const DeployInstance = () => {
  return (
    <Card className="relative w-full max-w-3xl rounded-[24px] border p-2">
      <DeployInstanceForm>
        <DeployInstanceFormFooter>
          <DeployInstanceSubmitButton />
          <DeployInstanceFormNote />
        </DeployInstanceFormFooter>
      </DeployInstanceForm>
    </Card>
  );
};
