"use client"

import HabitAnalytics from "@/components/HabitAnalytics"

export default function HabitStatsPage({ params }: { params: { id: string } }) {
  return <HabitAnalytics habitId={params.id} showBackButton />
}
