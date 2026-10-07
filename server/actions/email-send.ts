"use server"
import { Resend } from "resend"
// import { pretty, render } from "@react-email/render"
import { config } from "dotenv"
import getBaseUrl from "@/lib/base-url"
import ApplicationTemplate, { type ApplicationTemplateProps } from "@/components/email-templates/application"
import OrderConfirmationTemplate, { OrderConfirmationTemplateProps } from "@/components/email-templates/order-confirmation"

config({ path: ".env.local" })
const resend = new Resend(process.env.RESEND_API_KEY)
const domain = getBaseUrl()

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/confirm-email?token=${token}`

  const { data, error } = await resend.emails.send({
    from: process.env.NODE_ENV === "production" ? process.env.FS_ONBOARDING_EMAIL as string : "onboarding@resend.dev",
    to: email,
    subject: "Frey Smiles Orthodontics - Confirmation email",
    html: `<p>Click to <a href='${confirmLink}'>confirm your email</a></p>`,
  })

  if (error) return error
  if (data) return data
}

export const sendTwoFactorTokenByEmail = async (email: string, token: string) => {
  const { data, error } = await resend.emails.send({
    from: process.env.NODE_ENV === "production" ? process.env.FS_ONBOARDING_EMAIL as string : "onboarding@resend.dev",
    to: email,
    subject: "Frey Smiles Orthodontics - Your Two Factor Code",
    html: `<p>Your confirmation code: ${token}</p>`,
  })

  if (error) return error
  if (data) return data
}

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/reset-password?token=${token}`

  const { data, error } = await resend.emails.send({
    from: process.env.NODE_ENV === "production" ? process.env.FS_ONBOARDING_EMAIL as string : "onboarding@resend.dev",
    to: email,
    subject: "Frey Smiles Orthodontics - Password Reset",
    html: `<p>Click to <a href='${resetLink}'>reset your password</a></p>`,
  })

  if (error) return error
  if (data) return data
}

export async function sendApplication(
  formData: ApplicationTemplateProps,
){
  const { name, contactInfo, highSchoolGraduationYear, priorDentistryExperience, positionOfInterest, heardFrom, availabilityToStart, resume, questionResponse, additionalInfo } = formData
  
  const { data, error } = await resend.emails.send({
    from: process.env.NODE_ENV === "production" ? process.env.FS_EMAIL! : process.env.FS_ONBOARDING_EMAIL!,
    to: process.env.NODE_ENV === "production" ? process.env.FS_EMAIL! : process.env.FS_TEST_EMAIL!,
    subject: `${name} submitted an application to join FreySmiles`,
    // html: await pretty(await render(<ApplicationTemplate {...formData} />)),
    react: ApplicationTemplate({...formData}),
    attachments: [
      {
        filename: resume.filename,
        content: Buffer.from(resume.content).toString("base64"),
      }
    ],
  })

  if (error) return error
  if (data) return data
}

export async function sendOrderConfirmationEmail(
  orderData: OrderConfirmationTemplateProps
){
  const { email, lineItems, metadata, subtotal, total, discount,  paymentStatus } = orderData
  const { data, error } = await resend.emails.send({
    from: process.env.NODE_ENV === "production" ? process.env.FS_SHOP_EMAIL! : process.env.FS_ONBOARDING_EMAIL!,
    to: email,
    subject: `FreySmiles Order Confirmed - Thank you for your purchase`,
    react: OrderConfirmationTemplate({...orderData}),
  })

  if (error) return error
  if (data) return data
}