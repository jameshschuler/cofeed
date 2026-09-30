import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useChatContext } from "../../contexts/chat-context";

export function ClearChatButton() {
  const { messages, clear } = useChatContext();
  const [isConfirming, setIsConfirming] = useState(false);

  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-9"
        aria-label="Clear chat"
        title="Clear chat"
        onClick={() => setIsConfirming(true)}
      >
        <Trash2 className="size-5 sm:size-4" />
      </Button>
      <Dialog open={isConfirming} onOpenChange={setIsConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear chat history?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This removes the conversation from this device. Feeds and pumping sessions
            you logged stay saved.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsConfirming(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                clear();
                setIsConfirming(false);
              }}
            >
              Clear
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
