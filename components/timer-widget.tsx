"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatTime } from "@/lib/utils"

export function TimerWidget() {
  const [isRunning, setIsRunning] = useState(false)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds + 1)
      }, 1000)
    } else if (interval) {
      clearInterval(interval)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const toggleTimer = () => {
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    setIsRunning(false)
    setSeconds(0)
  }

  const { hours, minutes, remainingSeconds } = formatTime(seconds)

  return (
    <Card className="w-full sm:w-auto">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="font-mono text-lg">
              {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
              {String(remainingSeconds).padStart(2, "0")}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTimer}
              className={isRunning ? "bg-red-100 hover:bg-red-200 text-red-700" : ""}
            >
              {isRunning ? (
                <>
                  <Pause className="h-4 w-4 mr-1" /> Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" /> Start
                </>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={resetTimer} disabled={seconds === 0}>
              Reset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
