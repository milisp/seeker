import { AlertCircleIcon } from "lucide-react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

export function ItemFailed({ kind, summary }: { kind: string; summary: string }) {
  return (
    <Alert variant="destructive">
      <AlertCircleIcon />
      <AlertTitle>{kind} failed</AlertTitle>
      <AlertDescription>
        {summary}
      </AlertDescription>
    </Alert>
  )
}
