"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronLeft, Upload, AlertCircle, CheckCircle } from "lucide-react"

export default function ImportPage() {
    const router = useRouter()
    const supabase = createClient()

    const [jsonInput, setJsonInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'error' | 'success', message: string } | null>(null)

    const handleImport = async () => {
        setLoading(true)
        setStatus(null)

        try {
            const parsed = JSON.parse(jsonInput)

            if (!parsed.habits || !Array.isArray(parsed.habits)) {
                throw new Error("Invalid JSON format. Expected 'habits' array.")
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                throw new Error("User not authenticated.")
            }

            let habitsAdded = 0
            let completionsAdded = 0

            for (const habitData of parsed.habits) {
                // 1. Find or Create Habit
                let habitId = null

                // Check if exists
                const { data: existingHabits } = await supabase
                    .from('habits')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', habitData.name)
                    .maybeSingle()

                if (existingHabits) {
                    habitId = existingHabits.id
                } else {
                    // Create new
                    const { data: newHabit, error: createError } = await supabase
                        .from('habits')
                        .insert({
                            name: habitData.name || "Untitled Habit",
                            user_id: user.id,
                            color: 'neon-green', // Default color
                            period: 'daily',
                            frequency_days: 1
                        })
                        .select()
                        .single()

                    if (createError) throw createError
                    habitId = newHabit.id
                    habitsAdded++
                }

                // 2. Import Completions
                if (habitData.dates && typeof habitData.dates === 'object') {
                    const completionsToInsert = []

                    for (const [date, info] of Object.entries(habitData.dates)) {
                        // @ts-ignore
                        if (info && info.isMarked) {
                            // Check duplication locally if we were bulk inserting, 
                            // but simpler to just ignore conflict or check existence.
                            // For bulk speed, we could use upsert or ignoreDuplicates if Supabase supported it easily here.
                            // Let's iterate and check existence for safety, though slower.

                            // Actually, let's just attempt insert and ignore error if conflict? 
                            // Supabase insert doesn't strictly duplicate unless unique constraint.
                            // We should probably check first.

                            const { data: existingCompletion } = await supabase
                                .from('habit_completions')
                                .select('id')
                                .eq('habit_id', habitId)
                                .eq('date', date)
                                .maybeSingle()

                            if (!existingCompletion) {
                                completionsToInsert.push({
                                    habit_id: habitId,
                                    user_id: user.id,
                                    date: date
                                })
                            }
                        }
                    }

                    if (completionsToInsert.length > 0) {
                        const { error: insertError } = await supabase
                            .from('habit_completions')
                            .insert(completionsToInsert)

                        if (insertError) throw insertError
                        completionsAdded += completionsToInsert.length
                    }
                }
            }

            setStatus({
                type: 'success',
                message: `Import successful! Added/Matched ${parsed.habits.length} habits and imported ${completionsAdded} new completions.`
            })
            setJsonInput("")

        } catch (err: any) {
            console.error(err)
            setStatus({ type: 'error', message: err.message || "Failed to import data." })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background text-white flex flex-col p-6">
            <header className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-10 h-10 border-2 border-neutral-800 flex items-center justify-center hover:bg-neutral-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold uppercase tracking-wider">Import Data</h1>
            </header>

            <div className="flex-1 max-w-3xl mx-auto w-full space-y-6">
                <div className="p-6 border-2 border-neutral-800 bg-neutral-900/50">
                    <label className="block text-sm font-bold text-neutral-500 uppercase tracking-widest mb-4">
                        Paste JSON Data
                    </label>
                    <textarea
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        placeholder='{"habits": [{"name": "...", "dates": {...}}]}'
                        className="w-full h-96 bg-black border-2 border-neutral-800 p-4 font-mono text-sm text-neutral-300 focus:border-green-500 focus:outline-none transition-colors resize-none"
                    />
                </div>

                {status && (
                    <div className={`p-4 border-2 flex items-center gap-3 ${status.type === 'success' ? 'border-green-500/50 bg-green-500/10 text-green-500' : 'border-red-500/50 bg-red-500/10 text-red-500'
                        }`}>
                        {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <span className="font-bold uppercase tracking-wide text-sm">{status.message}</span>
                    </div>
                )}

                <button
                    onClick={handleImport}
                    disabled={loading || !jsonInput}
                    className={`w-full py-4 font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0)] hover:shadow-[0_0_30px_rgba(22,163,74,0.3)] ${loading
                            ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border-2 border-neutral-800'
                            : 'bg-green-600 text-white hover:bg-green-500 border-2 border-green-600 hover:border-green-500'
                        }`}
                >
                    {loading ? (
                        <span className="animate-pulse">Importing...</span>
                    ) : (
                        <>
                            <Upload size={20} />
                            Import Data
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
