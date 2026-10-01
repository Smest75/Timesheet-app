"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { useProjects } from "@/hooks/use-projects"
import { useTimeEntries } from "@/hooks/use-time-entries"
import {
  daysSince,
  downloadBackup,
  getLastBackupDate,
  markBackupTaken,
  mergeBackup,
  parseBackup,
  type ImportMode,
  type ParsedBackup,
} from "@/lib/backup"

const projectsLabel = (n: number) => `${n} ${n === 1 ? "project" : "projects"}`
const entriesLabel = (n: number) => `${n} ${n === 1 ? "time entry" : "time entries"}`

interface BackupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BackupDialog({ open, onOpenChange }: BackupDialogProps) {
  const { projects, replaceProjects } = useProjects()
  const { timeEntries, replaceTimeEntries } = useTimeEntries()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [lastBackup, setLastBackup] = useState<Date | null>(null)
  const [fileName, setFileName] = useState("")
  const [parsed, setParsed] = useState<ParsedBackup | null>(null)
  const [error, setError] = useState("")
  const [mode, setMode] = useState<ImportMode>("merge")
  const [result, setResult] = useState("")

  // Start fresh every time the dialog opens
  useEffect(() => {
    if (open) {
      setLastBackup(getLastBackupDate())
      setFileName("")
      setParsed(null)
      setError("")
      setMode("merge")
      setResult("")
    }
  }, [open])

  const hasData = projects.length > 0 || timeEntries.length > 0
  const mergePreview = parsed ? mergeBackup(projects, timeEntries, parsed) : null

  const handleExport = () => {
    downloadBackup(projects, timeEntries)
    markBackupTaken()
    setLastBackup(getLastBackupDate())
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setParsed(null)
    setError("")
    setResult("")
    if (!file) return
    setFileName(file.name)
    try {
      setParsed(parseBackup(await file.text()))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read the file")
    }
  }

  const handleImport = () => {
    if (!parsed || !mergePreview) return

    // Always save what's here now before changing anything, so an import can be undone
    if (hasData) {
      downloadBackup(projects, timeEntries, "timesheet-before-import")
    }

    if (mode === "replace") {
      replaceProjects(parsed.projects)
      replaceTimeEntries(parsed.timeEntries)
      setResult(`Replaced all data with ${projectsLabel(parsed.projects.length)} and ${entriesLabel(parsed.timeEntries.length)}.`)
    } else {
      replaceProjects(mergePreview.projects)
      replaceTimeEntries(mergePreview.timeEntries)
      setResult(
        `Added ${projectsLabel(mergePreview.addedProjects)} and ${entriesLabel(mergePreview.addedTimeEntries)}.` +
          (mergePreview.skippedProjects + mergePreview.skippedTimeEntries > 0
            ? ` Skipped ${projectsLabel(mergePreview.skippedProjects)} and ${entriesLabel(mergePreview.skippedTimeEntries)} that already exist.`
            : ""),
      )
    }

    setParsed(null)
    setFileName("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Backup</DialogTitle>
          <DialogDescription>
            Your data is only stored in this browser. Download a backup regularly and keep it somewhere safe.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-medium">Download backup</h3>
              <p className="text-sm text-muted-foreground">
                {projectsLabel(projects.length)}, {entriesLabel(timeEntries.length)}.{" "}
                {lastBackup
                  ? `Last backup ${lastBackup.toLocaleDateString("nb-NO")} (${daysSince(lastBackup)} days ago).`
                  : "No backup taken yet."}
              </p>
            </div>
            <Button onClick={handleExport} disabled={!hasData}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3">
          <div>
            <h3 className="font-medium">Restore from backup</h3>
            <p className="text-sm text-muted-foreground">
              Nothing is changed until you confirm. A copy of your current data is downloaded first.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="justify-start">
            <Upload className="h-4 w-4 mr-2" />
            {fileName || "Choose backup file…"}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Can't use this file</AlertTitle>
              <AlertDescription>{error}. Nothing was changed.</AlertDescription>
            </Alert>
          )}

          {parsed && mergePreview && (
            <>
              <p className="text-sm">
                The file contains <strong>{projectsLabel(parsed.projects.length)}</strong> and{" "}
                <strong>{entriesLabel(parsed.timeEntries.length)}</strong>
                {parsed.exportedAt ? `, exported ${new Date(parsed.exportedAt).toLocaleString("nb-NO")}` : ""}.
              </p>
              <RadioGroup value={mode} onValueChange={(value) => setMode(value as ImportMode)} className="gap-3">
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="merge" id="mode-merge" className="mt-1" />
                  <Label htmlFor="mode-merge" className="font-normal leading-snug">
                    <span className="font-medium">Merge</span> – add {projectsLabel(mergePreview.addedProjects)} and{" "}
                    {entriesLabel(mergePreview.addedTimeEntries)} that aren't here yet. Existing data is kept as it is.
                  </Label>
                </div>
                <div className="flex items-start gap-2">
                  <RadioGroupItem value="replace" id="mode-replace" className="mt-1" />
                  <Label htmlFor="mode-replace" className="font-normal leading-snug">
                    <span className="font-medium">Replace</span> – delete the {projectsLabel(projects.length)} and{" "}
                    {entriesLabel(timeEntries.length)} here now, and use only the data from the file.
                  </Label>
                </div>
              </RadioGroup>
            </>
          )}

          {result && (
            <Alert>
              <AlertTitle>Import complete</AlertTitle>
              <AlertDescription>{result}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {parsed && (
            <Button variant={mode === "replace" ? "destructive" : "default"} onClick={handleImport}>
              {mode === "replace" ? "Replace all data" : "Merge into my data"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
