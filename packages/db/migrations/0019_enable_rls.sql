-- Migration 0019: Enable Row-Level Security on user-owned tables
-- Defense-in-depth: the app already filters by userId in all queries,
-- but RLS prevents data leaks if a bug bypasses the ORM layer.
--
-- Architecture: Uses FORCE ROW LEVEL SECURITY with a GUC variable
-- (app.current_user_id) set per-request by the API middleware.

-- Enable RLS on critical user-owned tables
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user" FORCE ROW LEVEL SECURITY;

ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" FORCE ROW LEVEL SECURITY;

ALTER TABLE "subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "subscription" FORCE ROW LEVEL SECURITY;

ALTER TABLE "instance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instance" FORCE ROW LEVEL SECURITY;

ALTER TABLE "instance_skill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "instance_skill" FORCE ROW LEVEL SECURITY;

ALTER TABLE "affiliate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "affiliate" FORCE ROW LEVEL SECURITY;

ALTER TABLE "support_ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "support_ticket" FORCE ROW LEVEL SECURITY;

ALTER TABLE "ticket_reply" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ticket_reply" FORCE ROW LEVEL SECURITY;

-- Policies for "user" table — users can only see/modify themselves
CREATE POLICY user_isolation ON "user"
  USING (id = current_setting('app.current_user_id', true));

-- Policies for tables with direct userId FK
CREATE POLICY session_isolation ON "session"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY subscription_isolation ON "subscription"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY instance_isolation ON "instance"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY affiliate_isolation ON "affiliate"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY support_ticket_isolation ON "support_ticket"
  USING ("userId" = current_setting('app.current_user_id', true));

CREATE POLICY ticket_reply_isolation ON "ticket_reply"
  USING ("userId" = current_setting('app.current_user_id', true));

-- Policies for tables with indirect ownership (via instanceId FK)
CREATE POLICY instance_skill_isolation ON "instance_skill"
  USING ("instanceId" IN (
    SELECT id FROM "instance" WHERE "userId" = current_setting('app.current_user_id', true)
  ));
