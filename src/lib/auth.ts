import { randomBytes } from 'crypto'

export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex')
}

export function generateExpiryDate(): Date {
  const date = new Date()
  date.setHours(date.getHours() + 24) // Token expires in 24 hours
  return date
}
