import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - Early Autism Detector',
  description: 'Privacy policy for the Early Autism Detector application',
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              <strong>Last updated:</strong> {new Date().toLocaleDateString()}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Early Autism Detector ("we," "our," or "us") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information 
                when you use our autism screening application.
              </p>
              <p className="text-gray-700">
                This application is designed to provide educational information and screening tools 
                for autism spectrum disorder. We understand the sensitive nature of health information 
                and are committed to maintaining the highest standards of privacy protection.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and email address (for account creation)</li>
                <li>Child's information (name, date of birth, gender)</li>
                <li>Assessment responses and scores</li>
                <li>Progress notes and milestone tracking</li>
                <li>Chat history with our AI assistant</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Technical Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage patterns and preferences</li>
                <li>Location data (only when using center locator)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Provide and maintain our services</li>
                <li>Process and store assessment results</li>
                <li>Track developmental progress over time</li>
                <li>Provide personalized recommendations</li>
                <li>Improve our application and services</li>
                <li>Communicate with you about your account</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Limited access to personal information</li>
                <li>Secure authentication and session management</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell, trade, or rent your personal information. We may share information only in these circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With trusted service providers (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of communications</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-700">
                Our service is designed for parents and caregivers to track their children's development. 
                We do not knowingly collect personal information directly from children under 13. 
                All child-related information is collected through and controlled by the parent or guardian account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Us</h2>
              <p className="text-gray-700">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@earlyautismdetector.com<br />
                  <strong>Address:</strong> [Your Business Address]<br />
                  <strong>Phone:</strong> [Your Contact Number]
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes 
                by posting the new Privacy Policy on this page and updating the "Last updated" date. 
                Your continued use of the service after any changes constitutes acceptance of the new Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
