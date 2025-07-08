import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - Early Autism Detector',
  description: 'Terms of service for the Early Autism Detector application',
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the Early Autism Detector application ("Service"), you accept and agree 
                to be bound by the terms and provision of this agreement. If you do not agree to abide by the 
                above, please do not use this service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                Early Autism Detector is an educational tool designed to help parents and caregivers:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Complete autism screening assessments (M-CHAT-R)</li>
                <li>Track developmental milestones and progress</li>
                <li>Access educational information about autism</li>
                <li>Find autism-related resources and centers</li>
                <li>Communicate with an AI assistant for information</li>
              </ul>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 font-medium">
                  <strong>Important:</strong> This service is for educational and informational purposes only. 
                  It is not intended to diagnose, treat, cure, or prevent any medical condition. Always consult 
                  with qualified healthcare professionals for medical advice.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
              <p className="text-gray-700 mb-4">By using our service, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Use the service only for its intended purposes</li>
                <li>Respect the privacy and rights of others</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Not attempt to reverse engineer or hack the service</li>
                <li>Not share your account with unauthorized users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Medical Disclaimer</h2>
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <p className="text-red-800 mb-4">
                  <strong>This application is not a medical device and does not provide medical diagnoses.</strong>
                </p>
                <ul className="list-disc pl-6 text-red-700">
                  <li>Results are for educational purposes only</li>
                  <li>No doctor-patient relationship is created</li>
                  <li>Always consult healthcare professionals for medical concerns</li>
                  <li>Do not delay seeking medical advice based on app results</li>
                  <li>In emergencies, contact emergency services immediately</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Privacy and Data Protection</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our Privacy Policy, which is incorporated into these Terms by reference. By using our 
                service, you consent to the collection and use of information as outlined in our Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The service and its original content, features, and functionality are and will remain the 
                exclusive property of Early Autism Detector and its licensors. The service is protected by 
                copyright, trademark, and other laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, Early Autism Detector shall not be liable for any 
                indirect, incidental, special, consequential, or punitive damages, or any loss of profits 
                or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, 
                or other intangible losses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-700">
                We strive to maintain high availability but cannot guarantee uninterrupted service. 
                We reserve the right to modify, suspend, or discontinue the service at any time with 
                or without notice.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Account Termination</h2>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account and access to the service immediately, without 
                prior notice or liability, for any reason, including breach of these Terms.
              </p>
              <p className="text-gray-700">
                You may also delete your account at any time through the application settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of any 
                material changes. Your continued use of the service after changes constitutes acceptance 
                of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@earlyautismdetector.com<br />
                  <strong>Address:</strong> [Your Business Address]<br />
                  <strong>Phone:</strong> [Your Contact Number]
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
