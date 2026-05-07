"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectDialog } from "@/components/project-dialog"
import { useProjects } from "@/hooks/use-projects"
import type { Project, ProjectStatus } from "@/lib/types"

export function ProjectList() {
  const { projects } = useProjects()
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [statusFilters, setStatusFilters] = useState<ProjectStatus[]>([])
  const [clientFilters, setClientFilters] = useState<string[]>([])

  // Get unique clients for filter
  const uniqueClients = [...new Set(projects.map((project) => project.clientName))]

  useEffect(() => {
    let result = [...projects]

    if (statusFilters.length > 0) {
      result = result.filter((project) => statusFilters.includes(project.status))
    }

    if (clientFilters.length > 0) {
      result = result.filter((project) => clientFilters.includes(project.clientName))
    }

    setFilteredProjects(result)
  }, [projects, statusFilters, clientFilters])

  const getStatusColor = (status: ProjectStatus) => {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Projects</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2 font-medium">Status</div>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("active")}
                onCheckedChange={(checked) => {
                  setStatusFilters(checked ? [...statusFilters, "active"] : statusFilters.filter((s) => s !== "active"))
                }}
              >
                Active
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("done")}
                onCheckedChange={(checked) => {
                  setStatusFilters(checked ? [...statusFilters, "done"] : statusFilters.filter((s) => s !== "done"))
                }}
              >
                Done
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={statusFilters.includes("hold")}
                onCheckedChange={(checked) => {
                  setStatusFilters(checked ? [...statusFilters, "hold"] : statusFilters.filter((s) => s !== "hold"))
                }}
              >
                On Hold
              </DropdownMenuCheckboxItem>

              <div className="p-2 font-medium mt-2">Clients</div>
              {uniqueClients.map((client) => (
                <DropdownMenuCheckboxItem
                  key={client}
                  checked={clientFilters.includes(client)}
                  onCheckedChange={(checked) => {
                    setClientFilters(checked ? [...clientFilters, client] : clientFilters.filter((c) => c !== client))
                  }}
                >
                  {client}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/10">
          <p className="text-muted-foreground mb-4">No projects found</p>
          <Button onClick={() => setIsDialogOpen(true)}>Create your first project</Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Link href={`/projects/${project.id}`} key={project.id} className="block">
              <Card className="h-full transition-all hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge className={getStatusColor(project.status)} variant="secondary">
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </Badge>
                  </div>
                  <CardDescription>{project.clientName}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="text-sm">
                    <span className="font-medium">{project.hourlyRate} kr/hr</span>
                    {project.addVat && <span className="text-muted-foreground"> + MVA</span>}
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="text-sm text-muted-foreground">Click to view details and time entries</div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <ProjectDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
