"use client"

import { use } from "react"
import HabitAnalytics from "@/components/HabitAnalytics"

export default function HabitStatsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const supabase = createClient()

    // Unwrap params using React.use()
    const { id } = use(params)

    const [habit, setHabit] = useState<Habit | null>(null)
    const [completions, setCompletions] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        completionRate: 0,
    })
    const [insights, setInsights] = useState({
        last7Days: 0,
        last30Days: 0,
        activeWeeks: 0,
        bestWeekday: "—",
    })

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push("/auth/login")
            return
        }

        const [habitResponse, completionsResponse] = await Promise.all([
            supabase
                .from("habits")
                .select("*")
                .eq("id", id)
                .single(),
            supabase
                .from("habit_completions")
                .select("date")
                .eq("habit_id", id)
                .eq("user_id", user.id)
        ])

        setHabit(habitResponse.data)

        if (completionsResponse.data) {
            const dates = new Set(completionsResponse.data.map(c => c.date))
            setCompletions(dates)
            calculateStats(dates)
            calculateInsights(dates)
        } else {
            setCompletions(new Set())
            calculateStats(new Set())
            calculateInsights(new Set())
        }

        setLoading(false)
    }

    const calculateStats = (dates: Set<string>) => {
        // Basic stats calculation logic
        const today = new Date()
        let current = 0
        let longest = 0
        let temp = 0

        // Check backwards for current streak
        let d = new Date(today)
        while (true) {
            const key = d.toISOString().split('T')[0]
            if (dates.has(key)) {
                current++
                d.setDate(d.getDate() - 1)
            } else {
                if (d.toDateString() === today.toDateString()) {
                    d.setDate(d.getDate() - 1)
                    continue
                }
                break
            }
        }

        // Calculate Longest Streak (Naive approach: sort dates and iterate)
        const sortedDates = Array.from(dates).sort()
        if (sortedDates.length > 0) {
            temp = 1
            longest = 1
            for (let i = 1; i < sortedDates.length; i++) {
                const prev = new Date(sortedDates[i - 1])
                const curr = new Date(sortedDates[i])
                const diffTime = Math.abs(curr.getTime() - prev.getTime())
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                if (diffDays === 1) {
                    temp++
                } else {
                    longest = Math.max(longest, temp)
                    temp = 1
                }
            }
            longest = Math.max(longest, temp)
        }

        setStats({
            currentStreak: current,
            longestStreak: longest,
            totalDays: dates.size,
            completionRate: Math.round((dates.size / 365) * 100)
        })
    }

    const calculateInsights = (dates: Set<string>) => {
        const today = new Date()
        const weekdayCounts = Array(7).fill(0)
        let last7Days = 0
        let last30Days = 0

        for (let i = 0; i < 7; i++) {
            const day = new Date(today)
            day.setDate(today.getDate() - i)
            const key = day.toISOString().split("T")[0]
            if (dates.has(key)) last7Days++
        }

        for (let i = 0; i < 30; i++) {
            const day = new Date(today)
            day.setDate(today.getDate() - i)
            const key = day.toISOString().split("T")[0]
            if (dates.has(key)) last30Days++
        }

        dates.forEach((date) => {
            const parsed = new Date(`${date}T00:00:00`)
            weekdayCounts[parsed.getDay()] += 1
        })

        const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        const bestWeekdayIndex = weekdayCounts.findIndex(count => count === Math.max(...weekdayCounts))

        const weeksToCheck = 12
        let activeWeeks = 0
        for (let weekIndex = 0; weekIndex < weeksToCheck; weekIndex++) {
            const startOfWeek = new Date(today)
            startOfWeek.setDate(today.getDate() - today.getDay() - (weekIndex * 7))
            let weekHasCompletion = false
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const day = new Date(startOfWeek)
                day.setDate(startOfWeek.getDate() + dayOffset)
                const key = day.toISOString().split("T")[0]
                if (dates.has(key)) {
                    weekHasCompletion = true
                    break
                }
            }
            if (weekHasCompletion) activeWeeks++
        }

        setInsights({
            last7Days,
            last30Days,
            activeWeeks,
            bestWeekday: weekdayCounts.every(count => count === 0) ? "—" : weekdayNames[bestWeekdayIndex],
        })
    }

    // Generate weeks for contribution graph
    const generateWeeks = () => {
        const today = new Date()
        const endDate = new Date(today.getFullYear(), 11, 31) // End of current year
        const startDate = new Date(today.getFullYear(), 0, 1) // Start of current year

        // Determine the day of week of Jan 1st
        const startDay = startDate.getDay() // 0 = Sunday

        // Adjust start date back to the previous Sunday to align grid
        const gridStart = new Date(startDate)
        gridStart.setDate(startDate.getDate() - startDay)

        console.log(gridStart)

        const weeks = []
        let currentWeek = []
        let currentDate = new Date(gridStart)

        // Generate roughly 53 weeks to cover the year
        while (currentDate <= endDate || currentWeek.length > 0) {
            currentWeek.push(new Date(currentDate))

            if (currentWeek.length === 7) {
                weeks.push(currentWeek)
                currentWeek = []
            }
            currentDate.setDate(currentDate.getDate() + 1)

            // Safety break
            if (weeks.length > 54) break
        }

        return weeks
    }

    const weeks = generateWeeks()
    const habitColor = COLOR_PALETTE.find(c => c.name === habit?.color)?.value || "#10b981"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    if (loading) return <div className="h-screen bg-background flex items-center justify-center text-white font-sans">LOADING...</div>

    return (
        <div className="min-h-screen bg-background text-white p-6"> {/* Applied font-sans explicitly */}
            {/* Header */}
            <header className="flex items-center gap-4 mb-12 border-b-2 border-neutral-800 pb-6">
                <button
                    onClick={() => router.push('/')}
                    className="w-10 h-10 border-2 border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors rounded-none"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <span className="text-neutral-500 text-xs uppercase tracking-widest font-bold">HABIT DETAILS</span>
                    <h1 className="text-3xl font-bold uppercase tracking-tighter" style={{ color: habitColor }}>{habit?.name}</h1>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard label="CURRENT STREAK" value={`${stats.currentStreak} DAYS`} icon={<Zap size={20} />} color={habitColor} />
                <StatCard label="LONGEST STREAK" value={`${stats.longestStreak} DAYS`} icon={<Trophy size={20} />} />
                <StatCard label="TOTAL DAYS" value={stats.totalDays} icon={<Calendar size={20} />} />
                <StatCard label="COMPLETION RATE" value={`${stats.completionRate}%`} icon={<Target size={20} />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
                <StatCard label="LAST 7 DAYS" value={`${insights.last7Days}/7`} icon={<Zap size={18} />} color={habitColor} />
                <StatCard label="LAST 30 DAYS" value={`${insights.last30Days}/30`} icon={<Target size={18} />} />
                <StatCard label="BEST DAY" value={insights.bestWeekday} icon={<Calendar size={18} />} />
                <StatCard label="ACTIVE WEEKS (12)" value={`${insights.activeWeeks}/12`} icon={<Trophy size={18} />} />
            </div>

            {/* Contribution Grid Visualization */}
            <div className="mb-12">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="text-xl font-bold uppercase tracking-wider">YEAR OVERVIEW</h2>
                    <div className="flex gap-6 text-xs text-neutral-500 font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-neutral-900 border border-neutral-800 rounded-none"></div> LESS
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-none" style={{ backgroundColor: habitColor }}></div> MORE
                        </div>
                    </div>
                </div>

                <div className="w-full pt-12 pb-4 overflow-x-auto">
                    <div className="flex w-full min-w-[800px] md:min-w-0">


                        {/* The Grid */}
                        <div className="flex flex-1 w-full gap-[3px]">
                            {weeks.map((week, weekIndex) => {
                                const startsNewMonth = week.some(d => d.getDate() === 1)
                                const isFirstWeek = weekIndex === 0

                                return (
                                    <div
                                        key={weekIndex}
                                        className={`flex flex-col flex-1 gap-[3px] ${startsNewMonth && !isFirstWeek ? 'ml-6' : ''} relative`}
                                    >
                                        {startsNewMonth && (
                                            <div className="absolute -top-6 text-xs font-bold text-neutral-500 uppercase w-full text-center">
                                                {week.find(d => d.getDate() === 1 && d.getFullYear() === new Date().getFullYear())?.toLocaleString('default', { month: 'short' })}
                                            </div>
                                        )}

                                        {week.map((date, dayIndex) => {
                                            const dateKey = date.toISOString().split('T')[0]
                                            const isCompleted = completions.has(dateKey)
                                            const isCurrentYear = date.getFullYear() === new Date().getFullYear()

                                            if (!isCurrentYear) {
                                                return <div key={dateKey} className="w-full aspect-square invisible"></div>
                                            }

                                            return (
                                                <div
                                                    key={dateKey}
                                                    className="w-full aspect-square rounded-none transition-all hover:opacity-80 relative group"
                                                    style={{
                                                        backgroundColor: isCompleted ? habitColor : '#171717',
                                                        border: isCompleted ? `1px solid ${habitColor}` : '1px solid #262626'
                                                    }}
                                                    title={date.toDateString()}
                                                />
                                            )
                                        })}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

  return <HabitAnalytics habitId={id} showBackButton />
}
