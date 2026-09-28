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
import { useAuthFormContext } from "./auth-form-context";

export function ResetPassword() {
  const {
    state: {
      email,
      password,
      confirmPassword,
      isSubmitting,
      errorMessage,
      successMessage,
      isRecoverySession,
    },
    actions,
  } = useAuthFormContext();
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl sm:mx-auto sm:h-auto sm:max-w-md sm:self-center">
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
          onSubmit={
            isRecoverySession ? actions.onUpdatePassword : actions.onRequestReset
          }
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
                    onChange={(event) => actions.onEmailChange(event.target.value)}
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
                      onChange={(event) => actions.onPasswordChange(event.target.value)}
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
                      onChange={(event) =>
                        actions.onConfirmPasswordChange(event.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </>
            )}
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
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => actions.onNavigate("login")}
        >
          <ChevronLeft className="size-4" />
          Back to sign in
        </Button>
      </CardFooter>
    </Card>
  );
}
