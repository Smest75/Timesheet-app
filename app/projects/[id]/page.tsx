"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Clock, Edit, Trash2, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TimeEntryDialog } from "@/components/time-entry-dialog"
import { ProjectDialog } from "@/components/project-dialog"
import { ExportDialog } from "@/components/export-dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { useProjects } from "@/hooks/use-projects"
import { useTimeEntries } from "@/hooks/use-time-entries"
import { formatDate, formatDuration } from "@/lib/utils"
import type { Project, TimeEntry } from "@/lib/types"

export default function ProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { projects, deleteProject } = useProjects()
  const { timeEntries, deleteTimeEntry } = useTimeEntries()
  const [project, setProject] = useState<Project | null>(null)
  const [projectEntries, setProjectEntries] = useState<TimeEntry[]>([])
  const [isTimeEntryDialogOpen, setIsTimeEntryDialogOpen] = useState(false)
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [entryToEdit, setEntryToEdit] = useState<TimeEntry | undefined>(undefined)
  const [entryToDelete, setEntryToDelete] = useState<string | undefined>(undefined)

  useEffect(() => {
    const foundProject = projects.find((p) => p.id === params.id)
    if (foundProject) {
      setProject(foundProject)
    } else {
      router.push("/")
    }
  }, [params.id, projects, router])

  useEffect(() => {
    if (project) {
      const entries = timeEntries.filter((entry) => entry.projectId === project.id)
      setProjectEntries(entries)
    }
  }, [project, timeEntries])

  const handleEditEntry = (entry: TimeEntry) => {
    setEntryToEdit(entry)
    setIsTimeEntryDialogOpen(true)
  }

  const handleDeleteEntry = (entryId: string) => {
    setEntryToDelete(entryId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteEntry = () => {
    if (entryToDelete) {
      deleteTimeEntry(entryToDelete)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleDeleteProject = () => {
    if (project) {
      deleteProject(project.id)
      router.push("/")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-700 hover:bg-green-500/20"
      case "done":
        return "bg-gray-500/20 text-gray-700 hover:bg-gray-500/20"
      case "hold":
        return "bg-amber-500/20 text-amber-700 hover:bg-amber-500/20"
      default:
        return ""
    }
  }

  // Calculate total hours and earnings
  const totalMinutes = projectEntries.reduce((total, entry) => {
    return total + entry.hours * 60 + entry.minutes
  }, 0)

  const totalHours = totalMinutes / 60
  const totalEarnings = project ? totalHours * project.hourlyRate : 0

  if (!project) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge className={getStatusColor(project.status)} variant="secondary">
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Project Details</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsProjectDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600" onClick={handleDeleteProject}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Client</dt>
                  <dd>{project.clientName}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Hourly Rate</dt>
                  <dd>
                    {project.hourlyRate} kr{project.addVat ? " + MVA" : ""}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-2">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Total Time</dt>
                  <dd className="text-2xl font-bold">{formatDuration(totalMinutes)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Total Earnings</dt>
                  <dd className="text-2xl font-bold">
                    {totalEarnings.toFixed(2)} kr
                    {project.addVat && (
                      <span className="text-sm font-normal text-muted-foreground ml-1">
                        (+ {(totalEarnings * 0.25).toFixed(2)} kr MVA)
                      </span>
                    )}
                  </dd>
                </div>
                <div className="pt-2">
                  <Button className="w-full" variant="outline" onClick={() => setIsExportDialogOpen(true)}>
                    <Download className="h-4 w-4 mr-2" />
                    Export for Billing
                  </Button>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Time Entries</h2>
            <Button
              onClick={() => {
                setEntryToEdit(undefined)
                setIsTimeEntryDialogOpen(true)
              }}
            >
              Add Time Entry
            </Button>
          </div>

          {projectEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
              <p className="text-muted-foreground mb-4">No time entries yet</p>
              <Button onClick={() => setIsTimeEntryDialogOpen(true)}>Add your first time entry</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {projectEntries
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((entry) => (
                  <Card key={entry.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="font-medium">{entry.taskName}</div>
                          <div className="text-sm text-muted-foreground">{entry.billingComment}</div>
                          {entry.internalNote && (
                            <div className="text-sm italic text-muted-foreground">Note: {entry.internalNote}</div>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{formatDate(entry.date)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              {entry.hours}h {entry.minutes}m
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)}>
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => handleDeleteEntry(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </div>

      <TimeEntryDialog
        open={isTimeEntryDialogOpen}
        onOpenChange={setIsTimeEntryDialogOpen}
        projectId={project.id}
        timeEntryToEdit={entryToEdit}
      />

      <ProjectDialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen} projectToEdit={project} />

      <ExportDialog
        open={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        project={project}
        timeEntries={projectEntries}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Time Entry"
        description="Are you sure you want to delete this time entry? This action cannot be undone."
        onConfirm={confirmDeleteEntry}
      />
    </div>
  )
}
