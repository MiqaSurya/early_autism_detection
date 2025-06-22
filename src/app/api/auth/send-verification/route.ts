import { NextResponse } from 'next/server'
import sgMail from '@sendgrid/mail'

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is not set')
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export async function POST(request: Request) {
  try {
    const { email, verificationToken } = await request.json()

    const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify?token=${verificationToken}`

    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@earlyautismdetector.com',
      subject: 'Verify your Early Autism Detector account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2b6cb0;">Welcome to Early Autism Detector</h1>
          <p>Thank you for registering! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" 
               style="background-color: #4299e1; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p>${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    }

    await sgMail.send(msg)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('SendGrid error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email' },
      { status: 500 }
    )
  }
}
