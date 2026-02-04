"use client"

import { use } from "react"
import HabitAnalytics from "@/components/HabitAnalytics"

export default function HabitStatsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  return <HabitAnalytics habitId={id} showBackButton />
}
