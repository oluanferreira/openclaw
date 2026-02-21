import { Card } from "@workspace/ui-web/card";

import {
  CreateAssistantForm,
  CreateAssistantFormFooter,
  CreateAssistantFormNote,
  CreateAssistantSubmitButton,
} from "~/modules/dashboard/assistant/create/form";

export const CreateAssistant = () => {
  return (
    <Card className="relative w-full max-w-3xl rounded-[24px] border p-2 shadow-xs">
      <CreateAssistantForm>
        <CreateAssistantFormFooter>
          <CreateAssistantSubmitButton />
          <CreateAssistantFormNote />
        </CreateAssistantFormFooter>
      </CreateAssistantForm>
    </Card>
  );
};
