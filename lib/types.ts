export type ProjectStatus = "active" | "done" | "hold"

export interface Project {
  id: string
  name: string
  clientName: string
  hourlyRate: number
  status: ProjectStatus
  addVat: boolean
}

export interface TimeEntry {
  id: string
  projectId: string
  date: string
  hours: number
  minutes: number
  taskName: string
  billingComment: string
  internalNote: string
}
