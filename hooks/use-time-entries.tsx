"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { TimeEntry } from "@/lib/types"

interface TimeEntriesContextType {
  timeEntries: TimeEntry[]
  addTimeEntry: (entry: TimeEntry) => void
  updateTimeEntry: (entry: TimeEntry) => void
  deleteTimeEntry: (id: string) => void
}

const TimeEntriesContext = createContext<TimeEntriesContextType>({
  timeEntries: [],
  addTimeEntry: () => {},
  updateTimeEntry: () => {},
  deleteTimeEntry: () => {},
})

export function TimeEntriesProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])

  // Load time entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("timesheet-entries")
    if (savedEntries) {
      try {
        setTimeEntries(JSON.parse(savedEntries))
      } catch (error) {
        console.error("Failed to parse time entries from localStorage", error)
      }
    }
  }, [])

  // Save time entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timesheet-entries", JSON.stringify(timeEntries))
  }, [timeEntries])

  const addTimeEntry = (entry: TimeEntry) => {
    setTimeEntries((prev) => [...prev, entry])
  }

  const updateTimeEntry = (updatedEntry: TimeEntry) => {
    setTimeEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
  }

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return (
    <TimeEntriesContext.Provider value={{ timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry }}>
      {children}
    </TimeEntriesContext.Provider>
  )
}

export function useTimeEntries() {
  return useContext(TimeEntriesContext)
}
