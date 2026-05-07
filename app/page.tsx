import { ProjectList } from "@/components/project-list"
import { TimerWidget } from "@/components/timer-widget"

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Timesheet</h1>
            <p className="text-muted-foreground">Track your consulting hours and projects</p>
          </div>
          <TimerWidget />
        </div>
        <ProjectList />
      </div>
    </div>
  )
}
