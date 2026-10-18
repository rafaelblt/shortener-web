import { Form, redirect, useActionData, useLoaderData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { hasIssues } from "@/domain/issue";
import type { User } from "@/domain/user";
import { newPasswordIssue, PASSWORD_MIN_LENGTH } from "@/domain/user";
import { Button } from "@/ui/Button";
import { PageHeader } from "@/ui/PageHeader";
import { Panel } from "@/ui/Panel";
import { TextField } from "@/ui/TextField";

import { fieldMessages } from "../shared/field-messages";
import { formText } from "../shared/form-data";
import forms from "../shared/forms.module.css";
import { withNotice } from "../shared/notices";
import { servicesContext, signedInUserContext } from "../shared/route-context";
import { useSubmitting } from "../shared/use-submitting";
import styles from "./AccountPage.module.css";

interface AccountData {
  user: User;
}

interface PasswordChangeData {
  fields: { currentPassword?: string; newPassword?: string };
}

export function loader({ context }: LoaderFunctionArgs): AccountData {
  return { user: context.get(signedInUserContext) };
}

export async function action({
  request,
  context,
}: ActionFunctionArgs): Promise<PasswordChangeData> {
  const formData = await request.formData();
  const change = {
    currentPassword: formText(formData, "currentPassword"),
    newPassword: formText(formData, "newPassword"),
  };
  const issues = {
    currentPassword: change.currentPassword ? undefined : ("missing" as const),
    newPassword: newPasswordIssue(change.newPassword, change.currentPassword),
  };
  if (hasIssues(issues)) return { fields: fieldMessages(issues) };

  const result = await context.get(servicesContext).auth.changePassword(change);
  if (result.ok) throw redirect(withNotice("/sign-in", "password-changed"));
  if (result.error.code === "invalid_credentials") {
    return { fields: { currentPassword: "That isn't your current password." } };
  }
  return { fields: fieldMessages(result.error.fields) };
}

export function AccountPage() {
  const { user } = useLoaderData<AccountData>();
  const data = useActionData<PasswordChangeData>();
  const changing = useSubmitting();

  return (
    <div className={styles.page}>
      <title>Account · shortener</title>
      <PageHeader title="Account" />

      <dl className={styles.identity}>
        <div>
          <dt>Username</dt>
          <dd className={styles.username}>{user.username}</dd>
        </div>
        <div>
          <dt>User ID</dt>
          <dd className={styles.userId}>{user.id}</dd>
        </div>
      </dl>

      <Panel
        title="Change password"
        description="Changing it signs you out everywhere, this browser included."
      >
        <Form method="post" className={forms.form} noValidate>
          <TextField
            label="Current password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            error={data?.fields.currentPassword}
          />
          <TextField
            label="New password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
            error={data?.fields.newPassword}
          />
          <div className={forms.actions}>
            <Button type="submit" variant="primary" disabled={changing}>
              {changing ? "Changing…" : "Change password"}
            </Button>
          </div>
        </Form>
      </Panel>

      <Panel title="Sign out" description="End the session in this browser.">
        <Form method="post" action="/sign-out">
          <Button type="submit">Sign out</Button>
        </Form>
      </Panel>
    </div>
  );
}
