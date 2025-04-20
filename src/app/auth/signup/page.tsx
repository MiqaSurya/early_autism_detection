import { SignUpForm } from '@/components/auth/signup-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Create an Account</h1>
        <SignUpForm />
      </div>
    </div>
  )
}
