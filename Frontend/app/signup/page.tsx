import { SignupForm } from "@/components/signup-form"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="container flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              <div className="relative h-10 w-10 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-primary-foreground" />
                <div className="absolute inset-1 rounded-full bg-background flex items-center justify-center text-primary font-bold">
                  S
                </div>
              </div>
            </Link>
            <h1 className="text-2xl font-bold mt-4">Create an account</h1>
            <p className="text-muted-foreground mt-2">Sign up to get started with SkillSwap</p>
          </div>
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

