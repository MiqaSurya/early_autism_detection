export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-4">Check Your Email</h1>
        <p className="text-neutral-600 mb-8">
          We&apos;ve sent you an email with a link to verify your account.
          Please check your inbox and click the link to continue.
        </p>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">What&apos;s Next?</h2>
          <ol className="text-left space-y-2">
            <li>1. Open your email inbox</li>
            <li>2. Look for an email from AEDCompanion</li>
            <li>3. Click the verification link</li>
            <li>4. Return to complete your profile</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
