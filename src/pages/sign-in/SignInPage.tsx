import { Form, Link, redirect, useActionData } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

import { Button } from "@/ui/Button";
import { Notice } from "@/ui/Notice";
import { TextField } from "@/ui/TextField";

import styles from "../shared/AuthPage.module.css";
import { fieldMessage } from "../shared/field-messages";
import { formText } from "../shared/form-data";
import forms from "../shared/forms.module.css";
import { useNotice } from "../shared/notices";
import { servicesContext } from "../shared/route-context";
import { useSubmitting } from "../shared/use-submitting";

interface SignInData {
  error?: string;
  fields?: { username?: string; password?: string };
}

export async function loader({ context }: LoaderFunctionArgs) {
  if (await context.get(servicesContext).auth.currentUser()) throw redirect("/");
  return null;
}

export async function action({ request, context }: ActionFunctionArgs): Promise<SignInData> {
  const formData = await request.formData();
  const credentials = {
    username: formText(formData, "username"),
    password: formText(formData, "password"),
  };
  if (!credentials.username || !credentials.password) {
    return {
      fields: {
        username: credentials.username ? undefined : fieldMessage("username", "missing"),
        password: credentials.password ? undefined : fieldMessage("password", "missing"),
      },
    };
  }

  const result = await context.get(servicesContext).auth.signIn(credentials);
  if (!result.ok) return { error: "The username or the password is wrong." };
  throw redirect(pathAfterSignIn(request.url));
}

/** Where the guard of the signed-in pages came from, when it is a path of this app. */
function pathAfterSignIn(requestUrl: string): string {
  const next = new URL(requestUrl).searchParams.get("next") ?? "";
  const isLocalPath = next.startsWith("/") && !/^\/[/\\]/.test(next);
  return isLocalPath ? next : "/";
}

export function SignInPage() {
  const data = useActionData<SignInData>();
  const notice = useNotice();
  const submitting = useSubmitting();

  return (
    <div className={styles.page}>
      <title>Sign in · shortener</title>
      <div className={styles.heading}>
        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.lead}>Manage your short links.</p>
      </div>

      {notice && !data && <Notice tone="success">{notice}</Notice>}
      {data?.error && <Notice tone="error">{data.error}</Notice>}

      <Form method="post" className={forms.form} noValidate>
        <TextField
          label="Username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          error={data?.fields?.username}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          error={data?.fields?.password}
        />
        <Button type="submit" variant="primary" className={styles.submit} disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </Form>

      <p className={styles.switch}>
        New here? <Link to="/register">Create an account</Link>
      </p>
    </div>
  );
}
