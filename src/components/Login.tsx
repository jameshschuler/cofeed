import { Baby, ChevronLeft, Loader2, Lock, Mail } from "lucide-react";
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

export function Login() {
  const {
    state: { email, password, isSubmitting, errorMessage, successMessage },
    actions,
  } = useAuthFormContext();
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl sm:mx-auto sm:h-auto sm:max-w-md sm:self-center">
      <CardHeader>
        <CardTitle className="text-xl">Sign In</CardTitle>
        <CardDescription>
          Sign in with email and password to access your household.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <form className="flex h-full flex-col gap-4" onSubmit={actions.onLogin}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => actions.onEmailChange(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => actions.onPasswordChange(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center py-8 sm:py-10">
            <div className="max-w-xs text-center">
              <Baby className="mx-auto size-7 text-primary" />
              <p className="mt-3 text-sm font-medium text-foreground">
                Keep your household in sync.
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Log feeds, share updates, and stay close to the moments that matter.
              </p>
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
                  Signing in
                </>
              ) : (
                "Sign In"
              )}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => actions.onNavigate("reset-password")}
            >
              Forgot password?
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
            onClick={() => actions.onNavigate("signup")}
          >
            Need an account? Sign Up
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => actions.onNavigate("home")}
          >
            <ChevronLeft className="size-4" />
            Back to home
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
