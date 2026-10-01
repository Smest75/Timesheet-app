"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import type { TimeEntry } from "@/lib/types"

interface TimeEntriesContextType {
  timeEntries: TimeEntry[]
  addTimeEntry: (entry: TimeEntry) => void
  updateTimeEntry: (entry: TimeEntry) => void
  deleteTimeEntry: (id: string) => void
  replaceTimeEntries: (entries: TimeEntry[]) => void
}

const TimeEntriesContext = createContext<TimeEntriesContextType>({
  timeEntries: [],
  addTimeEntry: () => {},
  updateTimeEntry: () => {},
  deleteTimeEntry: () => {},
  replaceTimeEntries: () => {},
})

export function TimeEntriesProvider({ children }: { children: React.ReactNode }) {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  // Don't write to localStorage until the saved data has been read, so a
  // reload can never overwrite stored data with the initial empty list
  const [isLoaded, setIsLoaded] = useState(false)

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
    setIsLoaded(true)
  }, [])

  // Save time entries to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return
    localStorage.setItem("timesheet-entries", JSON.stringify(timeEntries))
  }, [timeEntries, isLoaded])

  const addTimeEntry = (entry: TimeEntry) => {
    setTimeEntries((prev) => [...prev, entry])
  }

  const updateTimeEntry = (updatedEntry: TimeEntry) => {
    setTimeEntries((prev) => prev.map((entry) => (entry.id === updatedEntry.id ? updatedEntry : entry)))
  }

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  const replaceTimeEntries = (entries: TimeEntry[]) => {
    setTimeEntries(entries)
  }

  return (
    <TimeEntriesContext.Provider value={{ timeEntries, addTimeEntry, updateTimeEntry, deleteTimeEntry, replaceTimeEntries }}>
      {children}
    </TimeEntriesContext.Provider>
  )
}

export function useTimeEntries() {
  return useContext(TimeEntriesContext)
}
