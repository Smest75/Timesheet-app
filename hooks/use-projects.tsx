"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { Project } from "@/lib/types"

interface ProjectsContextType {
  projects: Project[]
  isLoaded: boolean
  addProject: (project: Project) => void
  updateProject: (project: Project) => void
  deleteProject: (id: string) => void
  replaceProjects: (projects: Project[]) => void
}

const ProjectsContext = createContext<ProjectsContextType>({
  projects: [],
  isLoaded: false,
  addProject: () => {},
  updateProject: () => {},
  deleteProject: () => {},
  replaceProjects: () => {},
})

export function ProjectsProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  // Don't write to localStorage until the saved data has been read, so a
  // reload can never overwrite stored data with the initial empty list
  const [isLoaded, setIsLoaded] = useState(false)

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
    setIsLoaded(true)
  }, [])

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("timesheet-projects", JSON.stringify(projects))
  }, [projects, isLoaded])

  const addProject = (project: Project) => {
    setProjects((prev) => [...prev, project])
  }

  const updateProject = (updatedProject: Project) => {
    setProjects((prev) => prev.map((project) => (project.id === updatedProject.id ? updatedProject : project)))
  }

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id))
  }

  const replaceProjects = (projects: Project[]) => {
    setProjects(projects)
  }

  return (
    <ProjectsContext.Provider value={{ projects, isLoaded, addProject, updateProject, deleteProject, replaceProjects }}>
      {children}
    </ProjectsContext.Provider>
  )
}

export function useProjects() {
  return useContext(ProjectsContext)
}
