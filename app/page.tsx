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
  SlidersHorizontal,
  ChevronDown,
  X,
  GripVertical,
  LogOut,
  Menu,
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
  { name: "emerald", value: "#10b981", hue: 160 },
  { name: "teal", value: "#14b8a6", hue: 170 },
  { name: "cyan", value: "#06b6d4", hue: 180 },
  { name: "sky", value: "#0ea5e9", hue: 200 },
  { name: "blue", value: "#3b82f6", hue: 220 },
  { name: "indigo", value: "#6366f1", hue: 240 },
  { name: "violet", value: "#8b5cf6", hue: 260 },
  { name: "fuchsia", value: "#d946ef", hue: 290 },
  { name: "rose", value: "#f43f5e", hue: 340 },
  { name: "orange", value: "#f97316", hue: 30 },
  { name: "amber", value: "#f59e0b", hue: 45 },
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
  const [visibleDays] = useState(11)

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
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading your habits...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#111] text-white font-sans flex flex-col overflow-hidden">
      <header className="border-b border-neutral-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#16a34a] rounded flex items-center justify-center text-lg">✓</div>
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

      <div className="flex-1 p-6 overflow-hidden">
        <div className="flex gap-4 h-full">
          <div className="w-[264px] flex-shrink-0">
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
                    className="relative flex items-center gap-2 h-[52px] px-3 rounded-lg transition-all"
                    style={{
                      backgroundColor: colorData?.value ? `${colorData.value}20` : "#27272a",
                    }}
                  >
                    <button className="cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity">
                      <GripVertical size={18} className="text-neutral-500" />
                    </button>

                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Pencil size={16} className="text-neutral-400" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowingColorPicker(showingColorPicker === habit.id ? null : habit.id)
                      }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <Circle size={20} fill={colorData?.value} />
                    </button>

                    {showingColorPicker === habit.id && (
                      <div className="absolute left-12 top-14 z-50 bg-neutral-900 rounded-lg shadow-xl p-2 flex gap-2">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color.name}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateHabitColor(habit.id, color.name)
                            }}
                            className="w-8 h-8 rounded-full hover:scale-110 transition-transform"
                            style={{ backgroundColor: color.value }}
                          />
                        ))}
                      </div>
                    )}

                    <button className="opacity-0">
                      <Menu size={16} />
                    </button>

                    <div className="flex-1 text-left text-sm font-medium">{habit.name}</div>
                    {streak > 0 && <div className="text-xs opacity-75">{streak}d</div>}
                  </div>
                )
              })}

              <button
                onClick={addHabit}
                className="w-full h-[52px] flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800 rounded transition-all"
              >
                <Plus size={18} />
                New Habit
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden">
            <button
              onClick={() => handleScroll("left")}
              className="absolute left-0 top-4 w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"
              disabled={scrollOffset === 0}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => handleScroll("right")}
              className="absolute right-0 top-4 w-8 h-8 rounded-full bg-neutral-800/80 hover:bg-neutral-700 flex items-center justify-center transition-colors z-20 backdrop-blur-sm"
            >
              <ChevronRight size={16} />
            </button>

            <div className="flex h-16 items-end mb-2">
              {days.slice(scrollOffset, scrollOffset + visibleDays).map((date, idx) => {
                const { month, day, dayName } = formatDateDisplay(date)
                const today = isToday(date)
                return (
                  <div key={idx} className="flex-1 min-w-0">
                    <div className={`text-center ${today ? "text-white" : "text-neutral-500"}`}>
                      <div className="text-xs">{month}</div>
                      <div className={`text-lg font-semibold ${today ? "text-white" : ""}`}>{day}</div>
                      <div className="text-[10px] tracking-wider text-neutral-600">{dayName}</div>
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
                          backgroundColor: color || "#1a1a1a",
                          transition: "background-color 0.2s ease",
                        }}
                      >
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded whitespace-nowrap z-20 pointer-events-none">
                            {formatDateDisplay(date).month} {formatDateDisplay(date).day}
                          </div>
                        )}

                        <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
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
                  <div key={idx} className="flex-1 min-w-0 text-center text-xs text-neutral-500">
                    {count || 0}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {editingHabit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white text-black rounded-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#16a34a]">EDIT HABIT</h2>
              <button onClick={() => setEditingHabit(null)} className="text-neutral-400 hover:text-neutral-600">
                <X size={24} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-xs text-neutral-500 mb-2 uppercase tracking-wide">Habit</label>
              <input
                type="text"
                value={editingHabit.name}
                onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-[#16a34a] rounded text-lg focus:outline-none focus:border-[#15803d]"
              />
            </div>

            <div className="mb-6 pb-6 border-b">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingHabit.break_habit || false}
                  onChange={(e) => setEditingHabit({ ...editingHabit, break_habit: e.target.checked })}
                  className="w-4 h-4 accent-[#16a34a]"
                />
                <span className="font-medium">Break habit</span>
              </label>
              <p className="text-xs text-neutral-500 ml-6 mt-1">The colourful scale will be descending.</p>
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
                  className="px-6 py-2 border border-neutral-300 rounded hover:bg-neutral-100 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={saveHabit}
                  className="px-6 py-2 bg-[#16a34a] text-white rounded hover:bg-[#15803d] transition-colors font-medium"
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
