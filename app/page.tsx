"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Circle,
  X,
  GripVertical,
  LogOut,
} from "lucide-react"

type Habit = {
  id: string
  name: string
  color: string
  position: number
  user_id?: string
  break_habit?: boolean
  frequency?: string[]
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
      // Remover completion
      const { error } = await supabase.from("habit_completions").delete().eq("id", existingCompletion.id)

      if (!error) {
        setCompletions(completions.filter((c) => c.id !== existingCompletion.id))
      }
    } else {
      // Adicionar completion
      const { data, error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: userId,
          date: dateKey,
        })
        .select()
        .single()

      if (!error && data) {
        setCompletions([...completions, data])
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
      name: "New Habit",
      color: "emerald",
      position: habits.length,
      user_id: userId,
    }

    const { data, error } = await supabase.from("habits").insert(newHabit).select().single()

    if (!error && data) {
      setHabits([...habits, data])
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
    }
  }

  const saveHabit = async () => {
    if (!editingHabit) return

    const { error } = await supabase
      .from("habits")
      .update({
        name: editingHabit.name,
        color: editingHabit.color,
        break_habit: editingHabit.break_habit,
      })
      .eq("id", editingHabit.id)

    if (!error) {
      setHabits(habits.map((h) => (h.id === editingHabit.id ? editingHabit : h)))
      setEditingHabit(null)
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
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading your habits...</p>
        </div>
      </div>
    )
  }

  const todayIndex = days.findIndex((date) => isToday(date))
  const isAtEnd = scrollOffset >= todayIndex - visibleDays + 1

  return (
    <div className="h-[100dvh] bg-background text-white flex flex-col overflow-hidden">
      <header className="border-b-2 border-neutral-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logomarca.png" alt="Orbit" className="w-9 h-9 rounded" />
            <h1 className="text-xl font-semibold">Orbit</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto overflow-x-hidden">
        <div className="flex min-h-full pb-20">
          <div className="w-1/3 md:w-[264px] flex-shrink-0 border-r-2 border-neutral-800 pr-4 mr-4">
            <div className="flex items-center justify-between h-16 px-3 mb-2" />

            <div className="space-y-2">
              {habits.map((habit) => {
                const streak = getStreakInfo(habit.id)
                const colorData = COLOR_PALETTE.find((c) => c.name === habit.color)

                return (
                  <div
                    key={habit.id}
                    draggable={true}
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
                      onClick={() => router.push(`/habit/${habit.id}`)}
                      className="flex-1 text-left text-sm font-medium truncate cursor-pointer hover:text-primary transition-colors"
                    >
                      {habit.name}
                    </div>
                    {streak > 0 && <div className="text-xs opacity-75">{streak}d</div>}
                  </div>
                )
              })}

              <button
                onClick={addHabit}
                className="w-full h-[52px] flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all"
              >
                <Plus size={18} />
                <span className="hidden md:inline">New Habit</span>
              </button>
            </div>

            {habits.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-500">
                <p className="text-lg mb-2">No habits yet</p>
                <p className="text-sm">Click the + button to add your first habit!</p>
              </div>
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
              {habits.map((habit) => (
                <div key={habit.id} className="flex h-[52px]">
                  {days.slice(scrollOffset, scrollOffset + visibleDays).map((date, idx) => {
                    const dateKey = formatDateKey(date)
                    const isChecked = isHabitCompleted(habit.id, dateKey)
                    const color = getStreakColor(habit.id, date, habit)
                    const isHovered = hoveredCell?.habitId === habit.id && hoveredCell?.dateKey === dateKey

                    return (
                      <button
                        key={idx}
                        onClick={() => toggleHabit(habit.id, dateKey)}
                        onMouseEnter={() => setHoveredCell({ habitId: habit.id, dateKey })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className="flex-1 min-w-0 h-full relative group"
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

                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none" />
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 text-white rounded-none w-full max-w-2xl p-6 border border-neutral-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-primary">EDIT HABIT</h2>
              <button onClick={() => setEditingHabit(null)} className="text-neutral-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-neutral-400 mb-2 uppercase tracking-wide">Habit</label>
              <input
                type="text"
                value={editingHabit.name}
                onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                className="w-full px-4 py-3 bg-neutral-800 border-2 border-primary rounded text-lg text-white focus:outline-none focus:border-green-500 placeholder:text-neutral-500"
              />
            </div>

            <div className="mb-6 pb-6 border-b">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingHabit.break_habit || false}
                  onChange={(e) => setEditingHabit({ ...editingHabit, break_habit: e.target.checked })}
                  className="w-4 h-4 accent-primary"
                />
                <span className="font-medium">Break habit</span>
              </label>
              <p className="text-xs text-neutral-400 ml-6 mt-1">The colourful scale will be descending.</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => deleteHabit(editingHabit.id)}
                className="text-sm text-red-500 hover:text-red-700 font-medium"
              >
                ✕ delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingHabit(null)}
                  className="px-6 py-2 border border-neutral-700 rounded text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={saveHabit}
                  className="px-6 py-2 bg-primary text-white rounded hover:bg-green-700 transition-colors font-medium"
                >
                  EDIT HABIT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
