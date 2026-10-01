import type { Project, ProjectStatus, TimeEntry } from "@/lib/types"

export const BACKUP_APP_ID = "timesheet-app"
export const BACKUP_VERSION = 1

// localStorage keys for the backup reminder
export const LAST_BACKUP_KEY = "timesheet-last-backup"
export const REMINDER_SNOOZED_UNTIL_KEY = "timesheet-backup-reminder-snoozed-until"
// Fired on window when a backup has been taken, so the reminder can hide itself
export const BACKUP_TAKEN_EVENT = "timesheet-backup-taken"

export const BACKUP_REMINDER_DAYS = 30
export const REMINDER_SNOOZE_DAYS = 7

export interface BackupFile {
  app: typeof BACKUP_APP_ID
  version: typeof BACKUP_VERSION
  exportedAt: string
  projects: Project[]
  timeEntries: TimeEntry[]
}

export interface ParsedBackup {
  projects: Project[]
  timeEntries: TimeEntry[]
  exportedAt: string | null
}

export type ImportMode = "replace" | "merge"

export interface MergeResult {
  projects: Project[]
  timeEntries: TimeEntry[]
  addedProjects: number
  addedTimeEntries: number
  skippedProjects: number
  skippedTimeEntries: number
}

const PROJECT_STATUSES: ProjectStatus[] = ["active", "done", "hold"]

export function createBackup(projects: Project[], timeEntries: TimeEntry[]): BackupFile {
  return {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    projects,
    timeEntries,
  }
}

export function downloadBackup(projects: Project[], timeEntries: TimeEntry[], filenamePrefix = "timesheet-backup") {
  const backup = createBackup(projects, timeEntries)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `${filenamePrefix}-${backup.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function validateProject(value: unknown, index: number): Project {
  const where = `Project #${index + 1}`
  if (!isObject(value)) throw new Error(`${where} is not an object`)
  const { id, name, clientName, hourlyRate, status, addVat } = value
  if (typeof id !== "string" || !id) throw new Error(`${where} is missing an id`)
  if (typeof name !== "string") throw new Error(`${where} is missing a name`)
  if (typeof clientName !== "string") throw new Error(`${where} is missing a client name`)
  if (typeof hourlyRate !== "number" || !Number.isFinite(hourlyRate)) throw new Error(`${where} has an invalid hourly rate`)
  if (!PROJECT_STATUSES.includes(status as ProjectStatus)) throw new Error(`${where} has an invalid status`)
  if (typeof addVat !== "boolean") throw new Error(`${where} has an invalid VAT setting`)
  return { id, name, clientName, hourlyRate, status: status as ProjectStatus, addVat }
}

function validateTimeEntry(value: unknown, index: number): TimeEntry {
  const where = `Time entry #${index + 1}`
  if (!isObject(value)) throw new Error(`${where} is not an object`)
  const { id, projectId, date, hours, minutes, taskName, billingComment, internalNote } = value
  if (typeof id !== "string" || !id) throw new Error(`${where} is missing an id`)
  if (typeof projectId !== "string" || !projectId) throw new Error(`${where} is missing a project id`)
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`${where} has an invalid date`)
  if (typeof hours !== "number" || !Number.isFinite(hours) || hours < 0) throw new Error(`${where} has invalid hours`)
  if (typeof minutes !== "number" || !Number.isFinite(minutes) || minutes < 0) throw new Error(`${where} has invalid minutes`)
  if (typeof taskName !== "string") throw new Error(`${where} is missing a task name`)
  return {
    id,
    projectId,
    date,
    hours,
    minutes,
    taskName,
    billingComment: typeof billingComment === "string" ? billingComment : "",
    internalNote: typeof internalNote === "string" ? internalNote : "",
  }
}

function assertUniqueIds(items: { id: string }[], label: string) {
  const seen = new Set<string>()
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`The file contains duplicate ${label} (id ${item.id})`)
    seen.add(item.id)
  }
}

// Validates the whole file before anything is written. Accepts the backup format
// above, and the raw localStorage format ({"timesheet-projects": [...], "timesheet-entries": [...]}).
export function parseBackup(text: string): ParsedBackup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("The file is not valid JSON")
  }
  if (!isObject(data)) throw new Error("The file does not look like a timesheet backup")

  let rawProjects: unknown
  let rawEntries: unknown
  let exportedAt: string | null = null

  if (data.app === BACKUP_APP_ID) {
    if (data.version !== BACKUP_VERSION) throw new Error(`Unsupported backup version: ${String(data.version)}`)
    rawProjects = data.projects
    rawEntries = data.timeEntries
    exportedAt = typeof data.exportedAt === "string" ? data.exportedAt : null
  } else if ("timesheet-projects" in data || "timesheet-entries" in data) {
    rawProjects = data["timesheet-projects"]
    rawEntries = data["timesheet-entries"]
  } else {
    throw new Error("The file does not look like a timesheet backup")
  }

  if (!Array.isArray(rawProjects)) throw new Error("The file has no list of projects")
  if (!Array.isArray(rawEntries)) throw new Error("The file has no list of time entries")

  const projects = rawProjects.map(validateProject)
  const timeEntries = rawEntries.map(validateTimeEntry)
  assertUniqueIds(projects, "projects")
  assertUniqueIds(timeEntries, "time entries")

  return { projects, timeEntries, exportedAt }
}

// Adds imported items whose id doesn't exist yet. Existing items are never changed.
export function mergeBackup(
  currentProjects: Project[],
  currentTimeEntries: TimeEntry[],
  incoming: ParsedBackup,
): MergeResult {
  const projectIds = new Set(currentProjects.map((p) => p.id))
  const entryIds = new Set(currentTimeEntries.map((e) => e.id))
  const newProjects = incoming.projects.filter((p) => !projectIds.has(p.id))
  const newEntries = incoming.timeEntries.filter((e) => !entryIds.has(e.id))

  return {
    projects: [...currentProjects, ...newProjects],
    timeEntries: [...currentTimeEntries, ...newEntries],
    addedProjects: newProjects.length,
    addedTimeEntries: newEntries.length,
    skippedProjects: incoming.projects.length - newProjects.length,
    skippedTimeEntries: incoming.timeEntries.length - newEntries.length,
  }
}

function readDate(key: string): Date | null {
  try {
    const value = localStorage.getItem(key)
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

function writeDate(key: string, date: Date) {
  try {
    localStorage.setItem(key, date.toISOString())
  } catch {
    // Storage can be unavailable (private mode); the reminder just shows again
  }
}

export function getLastBackupDate(): Date | null {
  return readDate(LAST_BACKUP_KEY)
}

export function markBackupTaken() {
  writeDate(LAST_BACKUP_KEY, new Date())
  try {
    localStorage.removeItem(REMINDER_SNOOZED_UNTIL_KEY)
  } catch {
    // ignore
  }
  window.dispatchEvent(new Event(BACKUP_TAKEN_EVENT))
}

export function snoozeBackupReminder() {
  writeDate(REMINDER_SNOOZED_UNTIL_KEY, new Date(Date.now() + REMINDER_SNOOZE_DAYS * 24 * 60 * 60 * 1000))
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

export function isBackupReminderDue(): boolean {
  const snoozedUntil = readDate(REMINDER_SNOOZED_UNTIL_KEY)
  if (snoozedUntil && snoozedUntil.getTime() > Date.now()) return false
  const lastBackup = getLastBackupDate()
  return !lastBackup || daysSince(lastBackup) >= BACKUP_REMINDER_DAYS
}
