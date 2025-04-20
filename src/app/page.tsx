import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">
            Autism Early Detection Companion
          </h1>
          <p className="text-lg text-neutral-600">
            Supporting parents and caregivers in understanding early signs of autism
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">For Parents & Caregivers</h2>
            <p className="mb-6">
              Notice developmental differences in your child? Our structured questionnaire
              and AI-powered information can help you take the next step.
            </p>
            <Link href="/auth/signup" className="btn-primary inline-block">
              Get Started
            </Link>
          </div>

          <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Already a Member?</h2>
            <p className="mb-6">
              Access your dashboard to continue your assessment or find resources.
            </p>
            <Link href="/auth/login" className="btn-secondary inline-block">
              Sign In
            </Link>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6 text-center">Key Features</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">Early Signs Questionnaire</h3>
              <p>Validated screening questions to help identify potential signs of autism.</p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">AI Information Chat</h3>
              <p>Get reliable information about autism from our AI-powered chatbot.</p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-2">Treatment Center Locator</h3>
              <p>Find nearby diagnostic centers and support services.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
