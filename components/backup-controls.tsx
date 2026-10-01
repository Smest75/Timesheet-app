"use client"

import { useEffect, useState } from "react"
import { DatabaseBackup } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { BackupDialog } from "@/components/backup-dialog"
import { useProjects } from "@/hooks/use-projects"
import { useTimeEntries } from "@/hooks/use-time-entries"
import {
  BACKUP_TAKEN_EVENT,
  daysSince,
  getLastBackupDate,
  isBackupReminderDue,
  snoozeBackupReminder,
} from "@/lib/backup"

export function BackupButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
        <DatabaseBackup className="h-4 w-4 mr-2" />
        Backup
      </Button>
      <BackupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}

// Shown on the front page when there is data and no backup has been taken in the last 30 days
export function BackupReminder() {
  const { projects } = useProjects()
  const { timeEntries } = useTimeEntries()
  const [isDue, setIsDue] = useState(false)
  const [lastBackup, setLastBackup] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    const refresh = () => {
      setIsDue(isBackupReminderDue())
      setLastBackup(getLastBackupDate())
    }
    refresh()
    window.addEventListener(BACKUP_TAKEN_EVENT, refresh)
    return () => window.removeEventListener(BACKUP_TAKEN_EVENT, refresh)
  }, [])

  const hasData = projects.length > 0 || timeEntries.length > 0

  const handleSnooze = () => {
    snoozeBackupReminder()
    setIsDue(false)
  }

  return (
    <>
      {isDue && hasData && (
        <Alert className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <AlertTitle>Time for a backup</AlertTitle>
            <AlertDescription>
              {lastBackup
                ? `It's ${daysSince(lastBackup)} days since your last backup.`
                : "You haven't taken a backup yet."}{" "}
              Your data is only stored in this browser.
            </AlertDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" size="sm" onClick={handleSnooze}>
              Remind me later
            </Button>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              Back up now
            </Button>
          </div>
        </Alert>
      )}
      <BackupDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </>
  )
}
