import { type FormEvent } from "react";
import { ChevronLeft, Loader2, Lock, Mail } from "lucide-react";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function Signup({
  email,
  password,
  confirmPassword,
  isSubmitting,
  errorMessage,
  successMessage,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onGoToLogin,
  onGoToHome,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onGoToLogin: () => void;
  onGoToHome: () => void;
}) {
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl sm:mx-auto sm:h-auto sm:max-w-md sm:self-center">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>Create an account with email and password.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <form className="flex h-full flex-col gap-4" onSubmit={onSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-email"
                  type="email"
                  className="pl-9"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => onEmailChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-password"
                  type="password"
                  className="pl-9"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="signup-confirm-password"
                  type="password"
                  className="pl-9"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {errorMessage ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
                {successMessage}
              </p>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating account
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="mt-auto">
        <div className="grid w-full gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onGoToLogin}
          >
            Already have an account? Sign In
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onGoToHome}>
            <ChevronLeft className="size-4" />
            Back to home
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
