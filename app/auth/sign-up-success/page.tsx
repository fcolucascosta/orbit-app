import { Check, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
            <Check className="w-7 h-7 text-white" strokeWidth={3} />
          </div>
          <h1 className="text-2xl font-semibold text-white">everyday</h1>
        </div>

        {/* Success Message */}
        <div className="bg-card rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-500" />
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">Check your email</h2>
          <p className="text-gray-400 mb-6">
            We've sent you a confirmation email. Please click the link in the email to verify your account and start
            tracking your habits.
          </p>

          <Link href="/auth/login">
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-11">Back to sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
