import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Welcome to Your Dashboard</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <Link href="/dashboard/questionnaire" className="card group hover:shadow-xl transition-shadow">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-primary group-hover:text-primary/90">
              Early Signs Questionnaire
            </h2>
            <p className="text-neutral-600 mb-4 flex-grow">
              Complete our structured assessment to identify potential signs of autism in children aged 18 months to 5 years.
            </p>
            <span className="text-primary font-medium">Start Assessment →</span>
          </div>
        </Link>

        <Link href="/dashboard/chat" className="card group hover:shadow-xl transition-shadow">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-primary group-hover:text-primary/90">
              AI Information Chat
            </h2>
            <p className="text-neutral-600 mb-4 flex-grow">
              Get reliable answers to your questions about autism from our AI-powered chatbot.
            </p>
            <span className="text-primary font-medium">Start Chat →</span>
          </div>
        </Link>

        <Link href="/dashboard/locator" className="card group hover:shadow-xl transition-shadow">
          <div className="h-full flex flex-col">
            <h2 className="text-xl font-semibold mb-3 text-primary group-hover:text-primary/90">
              Treatment Center Locator
            </h2>
            <p className="text-neutral-600 mb-4 flex-grow">
              Find nearby diagnostic centers, therapists, and support services in your area.
            </p>
            <span className="text-primary font-medium">Find Centers →</span>
          </div>
        </Link>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold mb-6">Recent Activity</h2>
        <div className="card">
          <p className="text-neutral-600">
            Complete your first assessment to see your activity here.
          </p>
        </div>
      </div>
    </div>
  )
}
