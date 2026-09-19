import { Baby } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export function Home({
  onLogin,
  onSignup,
}: {
  onLogin: () => void;
  onSignup: () => void;
}) {
  return (
    <Card className="flex min-h-full w-full flex-col rounded-2xl">
      <CardHeader>
        <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Baby className="size-6" />
        </div>
        <CardTitle className="text-xl">CoFeed</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1" />
      </CardContent>
      <CardFooter className="mt-auto">
        <div className="grid w-full gap-2">
          <Button className="w-full" onClick={onLogin}>
            Sign In
          </Button>
          <Button className="w-full" variant="outline" onClick={onSignup}>
            Sign Up
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
