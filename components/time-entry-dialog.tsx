"use client"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
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
import { useTimeEntries } from "@/hooks/use-time-entries"
import type { TimeEntry } from "@/lib/types"

interface TimeEntryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  timeEntryToEdit?: TimeEntry
}

export function TimeEntryDialog({ open, onOpenChange, projectId, timeEntryToEdit }: TimeEntryDialogProps) {
  const { addTimeEntry, updateTimeEntry } = useTimeEntries()
  const isEditing = !!timeEntryToEdit

  const today = new Date().toISOString().split("T")[0]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TimeEntry>({
    defaultValues: timeEntryToEdit || {
      id: "",
      projectId,
      date: today,
      hours: 0,
      minutes: 0,
      taskName: "",
      billingComment: "",
      internalNote: "",
    },
  })

  // Reset form when timeEntryToEdit changes or dialog opens/closes
  useEffect(() => {
    if (open) {
      reset(
        timeEntryToEdit || {
          id: "",
          projectId,
          date: today,
          hours: 0,
          minutes: 0,
          taskName: "",
          billingComment: "",
          internalNote: "",
        },
      )
    }
  }, [open, timeEntryToEdit, reset, projectId, today])

  const onSubmit = (data: TimeEntry) => {
    if (isEditing) {
      updateTimeEntry(data)
    } else {
      addTimeEntry({
        ...data,
        id: crypto.randomUUID(),
        projectId,
      })
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Time Entry" : "Add Time Entry"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update your time entry details below." : "Add a new time entry for this project."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" {...register("date", { required: "Date is required" })} />
              {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="hours">Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  {...register("hours", {
                    required: "Hours is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Hours must be positive" },
                  })}
                />
                {errors.hours && <p className="text-sm text-red-500">{errors.hours.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="minutes">Minutes</Label>
                <Input
                  id="minutes"
                  type="number"
                  min="0"
                  max="59"
                  {...register("minutes", {
                    required: "Minutes is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Minutes must be positive" },
                    max: { value: 59, message: "Minutes must be less than 60" },
                  })}
                />
                {errors.minutes && <p className="text-sm text-red-500">{errors.minutes.message}</p>}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="taskName">Task Name</Label>
              <Input id="taskName" {...register("taskName", { required: "Task name is required" })} />
              {errors.taskName && <p className="text-sm text-red-500">{errors.taskName.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="billingComment">Billing Comment</Label>
              <Textarea
                id="billingComment"
                placeholder="This will appear on the invoice"
                {...register("billingComment")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="internalNote">Internal Note</Label>
              <Textarea
                id="internalNote"
                placeholder="For your reference only (not included in exports)"
                {...register("internalNote")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{isEditing ? "Save Changes" : "Add Entry"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
