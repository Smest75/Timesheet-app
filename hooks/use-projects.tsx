"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { Project } from "@/lib/types"

interface ProjectsContextType {
  projects: Project[]
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  deleteProject: (id: string) => void
}

const ProjectsContext = createContext<ProjectsContextType>({
  projects: [],
  addProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
})

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem("timesheet-projects")
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects))
      } catch (error) {
        console.error("Failed to parse projects from localStorage", error)
      }
    }
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timesheet-projects", JSON.stringify(projects))
  }, [projects])

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((project) => (project.id === updatedProject.id ? updatedProject : project)))
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id))
  }

  return (
    <ProjectsContext.Provider value={{ projects, addProject, updateProject, deleteProject }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  return useContext(ProjectsContext)
}
