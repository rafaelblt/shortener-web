import { Form, Link, redirect, useActionData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { hasIssues } from "@/domain/issue";
import {
  PASSWORD_MIN_LENGTH,
  passwordIssue,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  usernameIssue,
} from "@/domain/user";
import { Button } from "@/ui/Button";
import { TextField } from "@/ui/TextField";

import styles from "../shared/AuthPage.module.css";
import { fieldMessages } from "../shared/field-messages";
import { formText } from "../shared/form-data";
import forms from "../shared/forms.module.css";
import { withNotice } from "../shared/notices";
import { servicesContext } from "../shared/route-context";
import { useSubmitting } from "../shared/use-submitting";

interface RegisterData {
  fields: { username?: string; password?: string };
}

export async function loader({ context }: LoaderFunctionArgs) {
  if (await context.get(servicesContext).auth.currentUser()) throw redirect("/");
  return null;
}

export async function action({ request, context }: ActionFunctionArgs): Promise<RegisterData> {
  const { auth } = context.get(servicesContext);
  const formData = await request.formData();
  const credentials = {
    username: formText(formData, "username"),
    password: formText(formData, "password"),
  };
  const issues = {
    username: usernameIssue(credentials.username),
    password: passwordIssue(credentials.password),
  };
  if (hasIssues(issues)) return { fields: fieldMessages(issues) };

  const registered = await auth.register(credentials);
  if (!registered.ok) {
    const { error } = registered;
    if (error.code === "username_taken") return { fields: { username: "That username is taken." } };
    return { fields: fieldMessages(error.fields) };
  }

  // Creating an account doesn't sign in, so the page does it, for the person not to type it twice.
  const signedIn = await auth.signIn(credentials);
  throw redirect(signedIn.ok ? withNotice("/", "account-created") : "/sign-in");
}

export function RegisterPage() {
  const data = useActionData<RegisterData>();
  const submitting = useSubmitting();

  return (
    <div className={styles.page}>
      <title>Create an account · shortener</title>
      <div className={styles.heading}>
        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.lead}>A username and a password are all it takes.</p>
      </div>

      <Form method="post" className={forms.form} noValidate>
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          hint={`${USERNAME_MIN_LENGTH} to ${USERNAME_MAX_LENGTH} letters, digits, dots, dashes or underscores.`}
          error={data?.fields.username}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={data?.fields.password}
        />
        <Button type="submit" variant="primary" className={styles.submit} disabled={submitting}>
          {submitting ? "Creating the account…" : "Create account"}
        </Button>
      </Form>

      <p className={styles.switch}>
        Have an account? <Link to="/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
