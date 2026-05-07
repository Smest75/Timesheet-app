"use client"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useProjects } from "@/hooks/use-projects"
import type { Project, ProjectStatus } from "@/lib/types"

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectToEdit?: Project
}

export function ProjectDialog({ open, onOpenChange, projectToEdit }: ProjectDialogProps) {
  const { addProject, updateProject } = useProjects()
  const isEditing = !!projectToEdit

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<Project>({
    defaultValues: projectToEdit || {
      id: "",
      name: "",
      clientName: "",
      hourlyRate: 0,
      status: "active" as ProjectStatus,
      addVat: false,
    },
  })

  const status = watch("status")
  const addVat = watch("addVat")

  // Register custom fields that aren't directly supported by react-hook-form
  const handleStatusChange = (value: ProjectStatus) => {
    setValue("status", value)
  }

  const handleVatChange = (checked: boolean) => {
    setValue("addVat", checked)
  }

  const onSubmit = (data: Project) => {
    if (isEditing) {
      updateProject(data)
    } else {
      addProject({
        ...data,
        id: crypto.randomUUID(),
      })
    }
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Project" : "Create New Project"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update your project details below." : "Add a new project to track your consulting hours."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" {...register("name", { required: "Project name is required" })} />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input id="clientName" {...register("clientName", { required: "Client name is required" })} />
              {errors.clientName && <p className="text-sm text-red-500">{errors.clientName.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="hourlyRate">Hourly Rate (kr)</Label>
              <Input
                id="hourlyRate"
                type="number"
                {...register("hourlyRate", {
                  required: "Hourly rate is required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Rate must be positive" },
                })}
              />
              {errors.hourlyRate && <p className="text-sm text-red-500">{errors.hourlyRate.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(value) => handleStatusChange(value as ProjectStatus)}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="addVat" checked={addVat} onCheckedChange={handleVatChange} />
              <Label htmlFor="addVat">Add 25% VAT (MVA)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">{isEditing ? "Save Changes" : "Create Project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
