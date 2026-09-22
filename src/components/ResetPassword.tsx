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

export function ResetPassword({
  email,
  password,
  confirmPassword,
  isSubmitting,
  errorMessage,
  successMessage,
  isRecoverySession,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onRequestReset,
  onUpdatePassword,
  onGoToLogin,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  isRecoverySession: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onRequestReset: (event: FormEvent<HTMLFormElement>) => void;
  onUpdatePassword: (event: FormEvent<HTMLFormElement>) => void;
  onGoToLogin: () => void;
}) {
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">
          {isRecoverySession ? "Set a new password" : "Reset your password"}
        </CardTitle>
        <CardDescription>
          {isRecoverySession
            ? "Choose a new password for your CoFeed account."
            : "Enter your email and we will send you a reset link."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <form
          className="flex h-full flex-col gap-4"
          onSubmit={isRecoverySession ? onUpdatePassword : onRequestReset}
        >
          <div className="space-y-4">
            {!isRecoverySession ? (
              <div className="space-y-2">
                <Label htmlFor="reset-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    className="pl-9"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => onEmailChange(event.target.value)}
                    required
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      className="pl-9"
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => onPasswordChange(event.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm new password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type="password"
                      className="pl-9"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(event) => onConfirmPasswordChange(event.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1" />
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
                  {isRecoverySession ? "Updating password" : "Sending reset link"}
                </>
              ) : isRecoverySession ? (
                "Update Password"
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button type="button" variant="ghost" className="w-full" onClick={onGoToLogin}>
          <ChevronLeft className="size-4" />
          Back to sign in
        </Button>
      </CardFooter>
    </Card>
  );
}
