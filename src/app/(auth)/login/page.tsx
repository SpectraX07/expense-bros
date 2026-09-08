import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const errorMessage =
    params.error === "auth"
      ? "That sign-in link is invalid or expired. Try again."
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use your email and password, or a magic link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm errorMessage={errorMessage} />
      </CardContent>
    </Card>
  );
}
