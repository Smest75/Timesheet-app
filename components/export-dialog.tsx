"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatDateNorwegian, formatDurationNorwegian } from "@/lib/utils"
import type { Project, TimeEntry } from "@/lib/types"
import { Checkbox } from "@/components/ui/checkbox"

interface ExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project
  timeEntries: TimeEntry[]
}

export function ExportDialog({ open, onOpenChange, project, timeEntries }: ExportDialogProps) {
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [exportText, setExportText] = useState("")
  const [filteredEntries, setFilteredEntries] = useState<TimeEntry[]>([])
  const [includeInternalNotes, setIncludeInternalNotes] = useState(false)

  // Set default date range to cover all entries
  useEffect(() => {
    if (timeEntries.length > 0) {
      const dates = timeEntries.map((entry) => new Date(entry.date).getTime())
      const minDate = new Date(Math.min(...dates))
      const maxDate = new Date(Math.max(...dates))

      setStartDate(minDate.toISOString().split("T")[0])
      setEndDate(maxDate.toISOString().split("T")[0])
    } else {
      const today = new Date().toISOString().split("T")[0]
      setStartDate(today)
      setEndDate(today)
    }
  }, [timeEntries, open])

  // Filter entries by date range
  useEffect(() => {
    if (startDate && endDate) {
      const filtered = timeEntries.filter((entry) => {
        const entryDate = new Date(entry.date).getTime()
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime() + (24 * 60 * 60 * 1000 - 1) // End of the day

        return entryDate >= start && entryDate <= end
      })

      setFilteredEntries(filtered)
    }
  }, [startDate, endDate, timeEntries])

  // Generate export text
  useEffect(() => {
    if (filteredEntries.length === 0) {
      setExportText("Ingen registreringer funnet i valgt periode.")
      return
    }

    // Group entries by date
    const entriesByDate: Record<string, TimeEntry[]> = {}

    filteredEntries.forEach((entry) => {
      if (!entriesByDate[entry.date]) {
        entriesByDate[entry.date] = []
      }
      entriesByDate[entry.date].push(entry)
    })

    // Calculate totals
    const totalMinutes = filteredEntries.reduce((total, entry) => {
      return total + entry.hours * 60 + entry.minutes
    }, 0)

    const totalHours = totalMinutes / 60
    const totalAmount = totalHours * project.hourlyRate
    const vatAmount = project.addVat ? totalAmount * 0.25 : 0

    // Build the export text
    let text = `${project.clientName} - ${project.name}\n`
    text += `Periode: Fra ${formatDateNorwegian(startDate)} til ${formatDateNorwegian(endDate)}\n\n`

    // Add entries grouped by date
    Object.keys(entriesByDate)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .forEach((date) => {
        text += `${formatDateNorwegian(date)}:\n`

        entriesByDate[date].forEach((entry) => {
          const duration = formatDurationNorwegian(entry.hours * 60 + entry.minutes)
          text += `- ${entry.taskName} (${duration})`

          if (entry.billingComment) {
            text += `: ${entry.billingComment}`
          }

          if (entry.internalNote && includeInternalNotes) {
            text += `\n  Notat: ${entry.internalNote}`
          }

          text += "\n"
        })

        text += "\n"
      })

    // Add summary
    text += `Timer totalt: ${formatDurationNorwegian(totalMinutes)}\n`
    text += `Timepris: NOK ${project.hourlyRate}\n`
    text += `Total pris: NOK ${totalAmount.toFixed(2)}\n`

    if (project.addVat) {
      text += `MVA (25%): NOK ${vatAmount.toFixed(2)}\n`
      text += `Totalt, ink. MVA: NOK ${(totalAmount + vatAmount).toFixed(2)}\n`
    }

    setExportText(text)
  }, [filteredEntries, project, startDate, endDate, includeInternalNotes])

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(exportText)
      .then(() => {
        alert("Copied to clipboard!")
      })
      .catch((err) => {
        console.error("Failed to copy: ", err)
      })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export for Billing</DialogTitle>
          <DialogDescription>Generate a formatted text export for your accounting software.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeInternalNotes"
              checked={includeInternalNotes}
              onCheckedChange={setIncludeInternalNotes}
            />
            <Label htmlFor="includeInternalNotes">Include internal notes in export</Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exportText">Export Text</Label>
            <Textarea id="exportText" value={exportText} readOnly className="font-mono text-sm h-64" />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={copyToClipboard}>Copy to Clipboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
