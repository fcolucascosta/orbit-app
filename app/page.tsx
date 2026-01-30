"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast, Toaster } from "sonner"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Circle,
  X,
  GripVertical,
  LogOut,
  Archive,
  ArchiveRestore,
} from "lucide-react"

type Habit = {
  id: string
  name: string
  color: string
  position: number
  user_id?: string
  break_habit?: boolean
  frequency_days?: number
  period?: "daily" | "weekly"
  archived?: boolean
  archived_at?: string
}

type HabitCompletion = {
  id: string
  habit_id: string
  date: string
  user_id: string
}

const COLOR_PALETTE = [
  { name: "neon-green", value: "#00FF94", hue: 150 },
  { name: "neon-cyan", value: "#00F0FF", hue: 180 },
  { name: "electric-blue", value: "#2979FF", hue: 220 },
  { name: "deep-purple", value: "#651FFF", hue: 260 },
  { name: "neon-violet", value: "#D500F9", hue: 290 },
  { name: "hot-pink", value: "#FF00E6", hue: 320 },
  { name: "bright-red", value: "#FF1744", hue: 350 },
  { name: "neon-orange", value: "#FF6D00", hue: 30 },
  { name: "bright-yellow", value: "#FFD600", hue: 50 },
  { name: "lime", value: "#C6FF00", hue: 80 },
]

export default function HabitTracker() {
  const router = useRouter()
  const supabase = createClient()

  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<HabitCompletion[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [hoveredCell, setHoveredCell] = useState<{ habitId: string; dateKey: string } | null>(null)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)
  const [showingColorPicker, setShowingColorPicker] = useState<string | null>(null)
  const [draggedHabit, setDraggedHabit] = useState<string | null>(null)
  const [visibleDays, setVisibleDays] = useState(11)
  const [showArchived, setShowArchived] = useState(false)
  const [clickedCell, setClickedCell] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null)

  // Creation Modal State
  const [showingCreateModal, setShowingCreateModal] = useState(false)
  const [createData, setCreateData] = useState<{
    name: string
    color: string
    break_habit: boolean
    frequency_days: number
    period: "daily" | "weekly"
  }>({
    name: "New Habit",
    color: "neon-green",
    break_habit: false,
    frequency_days: 1,
    period: "daily"
  })

  useEffect(() => {
    const handleResize = () => {
      // Mobile: 3 days, Desktop: 11 days
      setVisibleDays(window.innerWidth < 768 ? 3 : 11)
    }

    // Initial check
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      // Verificar usuário logado
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push("/auth/login")
        return
      }

      setUserId(user.id)

      // Carregar hábitos
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true })

      if (habitsError) {
        console.error("[v0] Error loading habits:", habitsError)
      } else {
        setHabits(habitsData || [])
      }

      // Carregar completions dos últimos 180 dias
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 180)
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + 30)

      const { data: completionsData, error: completionsError } = await supabase
        .from("habit_completions")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`)
        .lte("date", `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`)

      if (completionsError) {
        console.error("[v0] Error loading completions:", completionsError)
      } else {
        setCompletions(completionsData || [])
      }
    } catch (error) {
      console.error("[v0] Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const generateDays = () => {
    const days = []
    const today = new Date()
    for (let i = -180; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      days.push(date)
    }
    return days
  }

  const days = generateDays()


  const formatDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (date: Date) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
    return {
      month: monthNames[date.getMonth()],
      day: date.getDate(),
      dayName: dayNames[date.getDay()],
    }
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const toggleHabit = async (habitId: string, dateKey: string) => {
    if (!userId) return

    const existingCompletion = completions.find((c) => c.habit_id === habitId && c.date === dateKey)

    if (existingCompletion) {
      // Optimistic update: remover imediatamente da UI
      const previousCompletions = [...completions]
      setCompletions(completions.filter((c) => c.id !== existingCompletion.id))

      // Remover do banco
      const { error } = await supabase.from("habit_completions").delete().eq("id", existingCompletion.id)

      if (error) {
        // Rollback: restaurar estado anterior
        setCompletions(previousCompletions)
        console.error("[Orbit] Erro ao desmarcar hábito:", error.message)
        toast.error("Failed to remove habit completion")
      }
    } else {
      // Optimistic update: adicionar placeholder imediatamente
      const tempId = `temp-${Date.now()}`
      const tempCompletion: HabitCompletion = {
        id: tempId,
        habit_id: habitId,
        user_id: userId,
        date: dateKey,
      }
      const previousCompletions = [...completions]
      setCompletions([...completions, tempCompletion])

      // Adicionar no banco
      const { data, error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: userId,
          date: dateKey,
        })
        .select()
        .single()

      if (error) {
        // Rollback: restaurar estado anterior
        setCompletions(previousCompletions)
        console.error("[Orbit] Erro ao marcar hábito:", error.message)
        toast.error("Failed to save habit completion")
      } else if (data) {
        // Substituir temp pelo ID real do banco
        setCompletions((prev) => prev.map((c) => (c.id === tempId ? data : c)))
      }
    }
  }

  const isHabitCompleted = (habitId: string, dateKey: string) => {
    return completions.some((c) => c.habit_id === habitId && c.date === dateKey)
  }

  const getStreakColor = (habitId: string, date: Date, habit: Habit) => {
    const dateKey = formatDateKey(date)
    const isChecked = isHabitCompleted(habitId, dateKey)

    if (!isChecked) {
      return "transparent"
    }

    // Encontrar todos os dias consecutivos do streak que incluem esta data
    const streakDays: Date[] = []
    const checkDate = new Date(date)

    // Encontrar início do streak (ir para trás)
    const tempBackward = new Date(date)
    while (true) {
      const key = formatDateKey(tempBackward)
      if (isHabitCompleted(habitId, key)) {
        tempBackward.setDate(tempBackward.getDate() - 1)
      } else {
        break
      }
    }
    tempBackward.setDate(tempBackward.getDate() + 1) // Voltar para o primeiro dia do streak

    // Encontrar fim do streak (ir para frente)
    const tempForward = new Date(tempBackward)
    while (true) {
      const key = formatDateKey(tempForward)
      if (isHabitCompleted(habitId, key)) {
        streakDays.push(new Date(tempForward))
        tempForward.setDate(tempForward.getDate() + 1)
      } else {
        break
      }
    }

    // Encontrar posição deste dia específico no streak
    let dayPosition = 0
    const targetDateStr = date.toDateString()
    for (let i = 0; i < streakDays.length; i++) {
      if (streakDays[i].toDateString() === targetDateStr) {
        dayPosition = i
        break
      }
    }

    const streakLength = streakDays.length
    const colorData = COLOR_PALETTE.find((c) => c.name === habit.color)
    const baseHue = colorData?.hue || 120

    // Calcular intensidade: 0 (primeiro dia/mais antigo) até 1 (último dia/mais recente)
    const intensity = streakLength > 1 ? dayPosition / (streakLength - 1) : 1

    // Saturação alta e constante
    const saturation = 75

    // Lightness: variar de forma linear e visível
    let lightness
    if (habit.break_habit) {
      // Break habit: começa ESCURO (forte) e vai CLAREANDO (desbotando)
      // 40% (escuro) → 80% (bem claro)
      lightness = 40 + intensity * 40
    } else {
      // Hábito normal: começa CLARO (fraco) e vai ESCURECENDO (forte)
      // 80% (bem claro) → 40% (escuro)
      lightness = 80 - intensity * 40
    }

    return `hsl(${baseHue}, ${saturation}%, ${lightness}%)`
  }

  const addHabit = async () => {
    if (!userId) return

    const newHabit = {
      name: createData.name || "New Habit",
      color: createData.color,
      position: habits.length,
      user_id: userId,
      break_habit: createData.break_habit,
      frequency_days: createData.period === 'daily' ? 1 : createData.frequency_days,
      period: createData.period
    }

    const { data, error } = await supabase.from("habits").insert(newHabit).select().single()

    if (!error && data) {
      setHabits([...habits, data])
      setShowingCreateModal(false)
      // Reset form
      setCreateData({
        name: "New Habit",
        color: "neon-green",
        break_habit: false,
        frequency_days: 1,
        period: "daily"
      })
      toast.success("Habit created successfully")
    } else {
      toast.error("Failed to create habit")
    }
  }

  const handleScroll = (direction: "left" | "right") => {
    setScrollOffset((prev) => {
      const newOffset = direction === "left" ? prev - 1 : prev + 1
      return Math.max(0, Math.min(newOffset, days.length - visibleDays))
    })
  }

  const getDayCompletionCount = (date: Date) => {
    const dateKey = formatDateKey(date)
    return habits.filter((habit) => isHabitCompleted(habit.id, dateKey)).length
  }

  const getStreakInfo = (habitId: string) => {
    let currentStreak = 0
    const today = new Date()
    const checkDate = new Date(today)

    while (true) {
      const key = formatDateKey(checkDate)
      if (isHabitCompleted(habitId, key)) {
        currentStreak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    return currentStreak
  }

  const deleteHabit = async (habitId: string) => {
    const { error } = await supabase.from("habits").delete().eq("id", habitId)

    if (!error) {
      setHabits(habits.filter((h) => h.id !== habitId))
      setCompletions(completions.filter((c) => c.habit_id !== habitId))
      setEditingHabit(null)
      setConfirmingDelete(null)
      toast.success("Habit deleted successfully")
    } else {
      toast.error("Failed to delete habit")
    }
  }

  const archiveHabit = async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ archived: true, archived_at: new Date().toISOString() })
      .eq("id", habitId)

    if (!error) {
      setHabits(habits.map((h) =>
        h.id === habitId ? { ...h, archived: true, archived_at: new Date().toISOString() } : h
      ))
      setEditingHabit(null)
      toast.success("Habit archived successfully")
    } else {
      toast.error("Failed to archive habit")
    }
  }

  const unarchiveHabit = async (habitId: string) => {
    const { error } = await supabase
      .from("habits")
      .update({ archived: false, archived_at: null })
      .eq("id", habitId)

    if (!error) {
      setHabits(habits.map((h) =>
        h.id === habitId ? { ...h, archived: false, archived_at: undefined } : h
      ))
      toast.success("Habit restored successfully")
    } else {
      toast.error("Failed to restore habit")
    }
  }

  const saveHabit = async () => {
    if (!editingHabit) return

    const updates = {
      name: editingHabit.name,
      color: editingHabit.color,
      break_habit: editingHabit.break_habit,
      frequency_days: editingHabit.period === 'daily' ? 1 : editingHabit.frequency_days,
      period: editingHabit.period
    }

    const { error } = await supabase
      .from("habits")
      .update(updates)
      .eq("id", editingHabit.id)

    if (!error) {
      setHabits(habits.map((h) => (h.id === editingHabit.id ? { ...h, ...updates } : h)))
      setEditingHabit(null)
      toast.success("Habit updated successfully")
    } else {
      toast.error("Failed to update habit")
    }
  }

  const updateHabitColor = async (habitId: string, color: string) => {
    const { error } = await supabase.from("habits").update({ color }).eq("id", habitId)

    if (!error) {
      setHabits(habits.map((h) => (h.id === habitId ? { ...h, color } : h)))
      setShowingColorPicker(null)
    }
  }

  const handleDragStart = (habitId: string) => {
    setDraggedHabit(habitId)
  }

  const handleDragOver = async (e: React.DragEvent, targetHabitId: string) => {
    e.preventDefault()
    if (!draggedHabit || draggedHabit === targetHabitId) return

    const draggedIndex = habits.findIndex((h) => h.id === draggedHabit)
    const targetIndex = habits.findIndex((h) => h.id === targetHabitId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newHabits = [...habits]
    const [removed] = newHabits.splice(draggedIndex, 1)
    newHabits.splice(targetIndex, 0, removed)

    // Atualizar posições
    const updates = newHabits.map((habit, index) => ({
      id: habit.id,
      position: index,
    }))

    // Atualizar no banco
    for (const update of updates) {
      await supabase.from("habits").update({ position: update.position }).eq("id", update.id)
    }

    setHabits(newHabits)
  }

  const handleDrop = async (targetHabitId: string) => {
    if (!draggedHabit || draggedHabit === targetHabitId) return

    const draggedIndex = habits.findIndex((h) => h.id === draggedHabit)
    const targetIndex = habits.findIndex((h) => h.id === targetHabitId)

    if (draggedIndex === -1 || targetIndex === -1) return

    const newHabits = [...habits]
    const [removed] = newHabits.splice(draggedIndex, 1)
    newHabits.splice(targetIndex, 0, removed)

    // Atualizar posições
    const updates = newHabits.map((habit, index) => ({
      id: habit.id,
      position: index,
    }))

    // Atualizar no banco
    for (const update of updates) {
      await supabase.from("habits").update({ position: update.position }).eq("id", update.id)
    }

    setHabits(newHabits)
    setDraggedHabit(null)
  }

  const handleDragEnd = () => {
    setDraggedHabit(null)
  }

  useEffect(() => {
    // Initial scroll to show today at the end
    const todayIndex = days.findIndex((date) => isToday(date))
    if (todayIndex !== -1) {
      const newOffset = Math.max(0, todayIndex - visibleDays + 1)
      setScrollOffset(newOffset)
    }
  }, [visibleDays]) // Re-run when visibleDays changes

  if (loading) {
    return (
      <div className="h-[100dvh] bg-background text-white flex flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="border-b-2 border-neutral-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-800 animate-pulse" />
              <div className="w-16 h-6 bg-neutral-800 animate-pulse" />
            </div>
            <div className="w-20 h-4 bg-neutral-800 animate-pulse" />
          </div>
        </header>

        <div className="flex-1 p-6 overflow-hidden">
          <div className="flex h-full">
            {/* Sidebar Skeleton */}
            <div className="w-1/3 md:w-[264px] flex-shrink-0 border-r-2 border-neutral-800 pr-4 mr-4">
              <div className="h-16 mb-2" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-[52px] bg-neutral-800/50 animate-pulse flex items-center px-3 gap-3">
                    <div className="w-4 h-4 bg-neutral-700 rounded-full" />
                    <div className="flex-1 h-4 bg-neutral-700" />
                  </div>
                ))}
              </div>
            </div>

            {/* Grid Skeleton */}
            <div className="w-2/3 md:flex-1">
              {/* Date Header Skeleton */}
              <div className="flex h-16 items-end mb-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                    <div className="w-8 h-3 bg-neutral-800 animate-pulse" />
                    <div className="w-6 h-5 bg-neutral-800 animate-pulse" />
                    <div className="w-6 h-2 bg-neutral-800 animate-pulse" />
                  </div>
                ))}
              </div>

              {/* Habit Rows Skeleton */}
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="flex h-[52px] gap-[1px]">
                    {[1, 2, 3, 4, 5, 6, 7].map((col) => (
                      <div key={col} className="flex-1 bg-neutral-800/30 animate-pulse" />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const todayIndex = days.findIndex((date) => isToday(date))
  const isAtEnd = scrollOffset >= todayIndex - visibleDays + 1

  // Filtrar hábitos: mostrar arquivados ou ativos dependendo do toggle
  const activeHabits = habits.filter((h) => !h.archived)
  const archivedHabits = habits.filter((h) => h.archived)
  const displayedHabits = showArchived ? archivedHabits : activeHabits

  return (
    <>
      <Toaster position="top-right" duration={3000} />
      <div className="h-[100dvh] bg-background text-white flex flex-col overflow-hidden">
      <header className="border-b-2 border-neutral-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logomarca.svg" alt="Everyday Logo" className="w-8 h-8 rounded-none" />
            <h1 className="text-xl font-semibold">Orbit</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/import")}
              className="hidden md:flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors uppercase tracking-wider font-medium"
            >
              <span className="text-xs">Import Data</span>
            </button>
            <div className="w-[1px] h-4 bg-neutral-800 hidden md:block"></div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full pb-20">
          <div className="w-1/3 md:w-[264px] flex-shrink-0 border-r-2 border-neutral-800 pr-4 mr-4">
            <div className="flex items-center justify-between h-16 px-3 mb-2" />

            <div className="space-y-2">
              {displayedHabits.map((habit) => {
                const streak = getStreakInfo(habit.id)
                const colorData = COLOR_PALETTE.find((c) => c.name === habit.color)

                return (
                  <div
                    key={habit.id}
                    draggable={!showArchived}
                    onDragStart={() => handleDragStart(habit.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(habit.id)}
                    className="relative flex items-center gap-2 h-[52px] px-3 rounded-none transition-all border-b border-neutral-800 last:border-0 hover:bg-neutral-800/50"
                    style={{
                      backgroundColor: colorData?.value ? `${colorData.value}20` : "var(--secondary)",
                    }}
                  >
                    <button className="cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity hidden md:block">
                      <GripVertical size={18} className="text-neutral-500" />
                    </button>

                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="hover:opacity-80 transition-opacity hidden md:block"
                    >
                      <Pencil size={16} className="text-neutral-400" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowingColorPicker(showingColorPicker === habit.id ? null : habit.id)
                      }}
                      className="hover:opacity-80 transition-opacity hidden md:block"
                    >
                      <Circle size={20} fill={colorData?.value} />
                    </button>

                    {showingColorPicker === habit.id && (
                      <div className="absolute left-0 md:left-12 top-14 z-50 bg-neutral-900 rounded-none shadow-xl p-2 flex flex-wrap gap-2 max-w-[200px]">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color.name}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateHabitColor(habit.id, color.name)
                            }}
                            className="w-8 h-8 rounded-none hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                    )}



                    <div
                      className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center justify-center md:justify-between mr-2 cursor-pointer group/label"
                      onClick={() => router.push(`/habit/${habit.id}`)}
                    >
                      <span className="text-sm font-medium truncate group-hover/label:text-primary transition-colors">
                        {habit.name}
                      </span>
                      {/* Streak or Weekly Goal Progress */}
                      {habit.period === 'weekly' && habit.frequency_days ? (
                        <div className="flex gap-1 mt-1 md:mt-0">
                          {Array.from({ length: habit.frequency_days }).map((_, i) => {
                            // Calculate completions for the *current calendar week*
                            const today = new Date()
                            const startOfWeek = new Date(today)
                            startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday

                            const endOfWeek = new Date(startOfWeek)
                            endOfWeek.setDate(endOfWeek.getDate() + 6)

                            const startKey = formatDateKey(startOfWeek)
                            const endKey = formatDateKey(endOfWeek)

                            // Count completions in this range using reliable string comparison
                            const weekCompletions = completions.filter(c =>
                              c.habit_id === habit.id &&
                              c.date >= startKey &&
                              c.date <= endKey
                            ).length

                            const isCompleted = i < weekCompletions

                            return (
                              <div
                                key={i}
                                className={`w-2 h-2 rounded-none border ${isCompleted ? `bg-${habit.color}-500 border-${habit.color}-500` : 'border-neutral-600 bg-transparent'}`}
                                style={{
                                  backgroundColor: isCompleted ? (COLOR_PALETTE.find(c => c.name === habit.color)?.value || '#fff') : 'transparent',
                                  borderColor: isCompleted ? (COLOR_PALETTE.find(c => c.name === habit.color)?.value || '#fff') : '#525252'
                                }}
                              />
                            )
                          })}
                        </div>
                      ) : (
                        streak > 0 && <div className="text-xs opacity-75 mt-0.5 md:mt-0">{streak}d</div>
                      )}
                    </div>
                  </div>
                )
              })}

              {!showArchived && (
                <button
                  onClick={() => setShowingCreateModal(true)}
                  className="w-full h-[52px] flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all"
                >
                  <Plus size={18} />
                  <span className="hidden md:inline">New Habit</span>
                </button>
              )}
            </div>

            {activeHabits.length === 0 && !showArchived && (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                <p className="text-lg mb-2">No habits yet</p>
                <p className="text-sm">Click the + button to add your first habit!</p>
              </div>
            )}

            {showArchived && archivedHabits.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                <p className="text-lg mb-2">No archived habits</p>
                <p className="text-sm">Archived habits will appear here</p>
              </div>
            )}

            {/* Toggle para ver arquivados */}
            {archivedHabits.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full mt-4 py-2 flex items-center justify-center gap-2 text-xs text-neutral-500 hover:text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-all"
              >
                {showArchived ? (
                  <>
                    <ArchiveRestore size={14} />
                    <span>Show Active ({activeHabits.length})</span>
                  </>
                ) : (
                  <>
                    <Archive size={14} />
                    <span>Show Archived ({archivedHabits.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="w-2/3 md:flex-1 relative overflow-hidden">
            <button
              onClick={() => handleScroll("left")}
              className="absolute left-0 top-0 md:top-4 w-6 h-6 md:w-8 md:h-8 rounded-none bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"
              disabled={scrollOffset === 0}
            >
              <ChevronLeft size={16} className="w-3 h-3 md:w-4 md:h-4" />
            </button>

            {!isAtEnd && (
              <button
                onClick={() => handleScroll("right")}
                className="absolute right-0 top-0 md:top-4 w-6 h-6 md:w-8 md:h-8 rounded-none bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"
              >
                <ChevronRight size={16} className="w-3 h-3 md:w-4 md:h-4" />
              </button>
            )}

            <div className="flex h-16 items-end mb-2">
              {days.slice(scrollOffset, scrollOffset + visibleDays).map((date, idx) => {
                const { month, day, dayName } = formatDateDisplay(date)
                const today = isToday(date)
                return (
                  <div key={idx} className="flex-1 min-w-0">
                    <div className={`text-center ${today ? "text-white" : "text-neutral-400"}`}>
                      <div className="text-xs">{month}</div>
                      <div className={`text-lg font-semibold ${today ? "text-white" : ""}`}>{day}</div>
                      <div className="text-[10px] tracking-wider text-neutral-500">{dayName}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2">
              {displayedHabits.map((habit) => (
                <div key={habit.id} className="flex h-[52px]">
                  {days.slice(scrollOffset, scrollOffset + visibleDays).map((date, idx) => {
                    const dateKey = formatDateKey(date)
                    const isChecked = isHabitCompleted(habit.id, dateKey)
                    const color = getStreakColor(habit.id, date, habit)
                    const isHovered = hoveredCell?.habitId === habit.id && hoveredCell?.dateKey === dateKey

                    const cellKey = `${habit.id}-${dateKey}`
                    const isClicked = clickedCell === cellKey

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setClickedCell(cellKey)
                          toggleHabit(habit.id, dateKey)
                          setTimeout(() => setClickedCell(null), 300)
                        }}
                        onMouseEnter={() => setHoveredCell({ habitId: habit.id, dateKey })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`flex-1 min-w-0 h-full relative group ${isClicked ? 'animate-pulse-once' : ''}`}
                        style={{
                          backgroundColor: color || "var(--card)",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                            {formatDateDisplay(date).month} {formatDateDisplay(date).day}
                          </div>
                        )}

                        <div className={`absolute inset-0 bg-white transition-opacity pointer-events-none ${isClicked ? 'opacity-30' : 'opacity-0 group-hover:opacity-10'}`} />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="flex h-8 items-center mt-4 border-t border-neutral-800 pt-2">
              {days.slice(scrollOffset, scrollOffset + visibleDays).map((date, idx) => {
                const count = getDayCompletionCount(date)
                return (
                  <div key={idx} className="flex-1 min-w-0 text-center text-xs text-neutral-400">
                    {count || 0}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {editingHabit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 text-white rounded-none w-full max-w-md p-0 border-2 border-neutral-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-neutral-800 bg-neutral-900">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">EDIT HABIT</h2>
              <button
                onClick={() => setEditingHabit(null)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">NAME</label>
                <input
                  type="text"
                  placeholder="E.g. Gym, Read, Meditate"
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  className="w-full bg-black border-2 border-neutral-800 p-4 text-lg font-bold text-white placeholder-neutral-700 focus:border-green-500 focus:outline-none rounded-none transition-colors"
                />
              </div>

              {/* Frequency Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">FREQUENCY</label>
                <div className="flex w-full border-2 border-neutral-800">
                  <button
                    onClick={() => setEditingHabit({ ...editingHabit, period: 'daily' })}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${(!editingHabit.period || editingHabit.period === 'daily')
                      ? 'bg-neutral-100 text-black'
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    Every Day
                  </button>
                  <div className="w-[2px] bg-neutral-800"></div>
                  <button
                    onClick={() => setEditingHabit({ ...editingHabit, period: 'weekly', frequency_days: editingHabit.frequency_days || 3 })}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${editingHabit.period === 'weekly'
                      ? 'bg-neutral-100 text-black'
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Weekly Days Selector (Only if Weekly) */}
              {editingHabit.period === 'weekly' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    DAYS PER WEEK: <span className="text-white text-lg ml-2">{editingHabit.frequency_days || 3}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={editingHabit.frequency_days || 3}
                    onChange={(e) => setEditingHabit({ ...editingHabit, frequency_days: parseInt(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-neutral-800 rounded-none appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-neutral-600 font-mono mt-1">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                  </div>
                </div>
              )}

              {/* Break Habit Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${editingHabit.break_habit ? 'bg-red-500 border-red-500' : 'border-neutral-700 bg-transparent group-hover:border-neutral-500'
                    }`}>
                    {editingHabit.break_habit && <X size={16} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={editingHabit.break_habit || false}
                    onChange={(e) => setEditingHabit({ ...editingHabit, break_habit: e.target.checked })}
                    className="hidden"
                  />
                  <div>
                    <span className="font-bold uppercase text-sm text-neutral-300 group-hover:text-white transition-colors">Break a bad habit</span>
                    <p className="text-[10px] text-neutral-600 font-medium uppercase mt-0.5">Colors will fade as you succeed</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 space-y-3">
                <div className="flex gap-3">
                  {editingHabit.archived ? (
                    <button
                      onClick={() => unarchiveHabit(editingHabit.id)}
                      className="flex-1 py-4 border-2 border-green-900/50 text-green-500 font-bold uppercase tracking-wider hover:bg-green-900/20 hover:border-green-500 transition-all flex items-center justify-center gap-2"
                    >
                      <ArchiveRestore size={18} />
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => archiveHabit(editingHabit.id)}
                      className="flex-1 py-4 border-2 border-orange-900/50 text-orange-500 font-bold uppercase tracking-wider hover:bg-orange-900/20 hover:border-orange-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Archive size={18} />
                      Archive
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmingDelete(editingHabit.id)}
                    className="flex-1 py-4 border-2 border-red-900/50 text-red-500 font-bold uppercase tracking-wider hover:bg-red-900/20 hover:border-red-500 transition-all"
                  >
                    Delete
                  </button>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setEditingHabit(null)}
                    className="flex-1 py-4 border-2 border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider hover:bg-neutral-800 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveHabit}
                    className="flex-1 py-4 bg-green-600 text-white font-bold uppercase tracking-wider hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)]"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showingCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 text-white rounded-none w-full max-w-md p-0 border-2 border-neutral-800 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b-2 border-neutral-800 bg-neutral-900">
              <h2 className="text-xl font-bold uppercase tracking-wider text-white">NEW HABIT</h2>
              <button
                onClick={() => setShowingCreateModal(false)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">NAME</label>
                <input
                  type="text"
                  placeholder="E.g. Gym, Read, Meditate"
                  value={createData.name === "New Habit" ? "" : createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  className="w-full bg-black border-2 border-neutral-800 p-4 text-lg font-bold text-white placeholder-neutral-700 focus:border-green-500 focus:outline-none rounded-none transition-colors"
                />
              </div>

              {/* Frequency Toggle */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">FREQUENCY</label>
                <div className="flex w-full border-2 border-neutral-800">
                  <button
                    onClick={() => setCreateData({ ...createData, period: 'daily' })}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${createData.period === 'daily'
                      ? 'bg-neutral-100 text-black'
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    Every Day
                  </button>
                  <div className="w-[2px] bg-neutral-800"></div>
                  <button
                    onClick={() => setCreateData({ ...createData, period: 'weekly', frequency_days: 3 })}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${createData.period === 'weekly'
                      ? 'bg-neutral-100 text-black'
                      : 'bg-transparent text-neutral-500 hover:text-neutral-300'
                      }`}
                  >
                    Weekly
                  </button>
                </div>
              </div>

              {/* Weekly Days Selector (Only if Weekly) */}
              {createData.period === 'weekly' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
                    DAYS PER WEEK: <span className="text-white text-lg ml-2">{createData.frequency_days}</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="7"
                    step="1"
                    value={createData.frequency_days}
                    onChange={(e) => setCreateData({ ...createData, frequency_days: parseInt(e.target.value) })}
                    className="w-full accent-green-500 h-2 bg-neutral-800 rounded-none appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-neutral-600 font-mono mt-1">
                    <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                  </div>
                </div>
              )}

              {/* Break Habit Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${createData.break_habit ? 'bg-red-500 border-red-500' : 'border-neutral-700 bg-transparent group-hover:border-neutral-500'
                    }`}>
                    {createData.break_habit && <X size={16} className="text-white" />}
                  </div>
                  <input
                    type="checkbox"
                    checked={createData.break_habit}
                    onChange={(e) => setCreateData({ ...createData, break_habit: e.target.checked })}
                    className="hidden"
                  />
                  <div>
                    <span className="font-bold uppercase text-sm text-neutral-300 group-hover:text-white transition-colors">Break a bad habit</span>
                    <p className="text-[10px] text-neutral-600 font-medium uppercase mt-0.5">Colors will fade as you succeed</p>
                  </div>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setShowingCreateModal(false)}
                  className="flex-1 py-4 border-2 border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider hover:bg-neutral-800 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={addHabit}
                  className="flex-1 py-4 bg-green-600 text-white font-bold uppercase tracking-wider hover:bg-green-500 transition-all shadow-[0_0_20px_rgba(22,163,74,0.3)] hover:shadow-[0_0_30px_rgba(22,163,74,0.5)]"
                >
                  Create Habit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Deleção */}
      {confirmingDelete && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
          <div className="bg-neutral-900 text-white rounded-none w-full max-w-sm p-0 border-2 border-red-900/50 shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 border-2 border-red-500 flex items-center justify-center">
                  <X size={24} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wider text-white mb-2">Delete Habit?</h3>
                <p className="text-sm text-neutral-400">
                  This action cannot be undone. All completion data for this habit will be permanently deleted.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setConfirmingDelete(null)}
                  className="flex-1 py-3 border-2 border-neutral-800 text-neutral-400 font-bold uppercase tracking-wider hover:bg-neutral-800 hover:text-white transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteHabit(confirmingDelete)}
                  className="flex-1 py-3 bg-red-600 text-white font-bold uppercase tracking-wider hover:bg-red-500 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
