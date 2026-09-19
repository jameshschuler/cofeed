import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

export function SessionRequired({ onGoToLogin }: { onGoToLogin: () => void }) {
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Session required</CardTitle>
        <CardDescription>Sign in to access the dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex-1" />
      </CardContent>
      <CardFooter className="mt-auto">
        <Button className="w-full" onClick={onGoToLogin}>
          Sign In
        </Button>
      </CardFooter>
    </Card>
  );
}
