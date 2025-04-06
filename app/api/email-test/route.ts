import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email-utils";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    console.log(`Attempting to send test email to: ${email}`);
    console.log(`Using email credentials: ${process.env.EMAIL_USER}`);

    const sent = await sendEmail(
      email,
      "DhanSetu Email Test",
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>DhanSetu Email System Test</h2>
          <p>This is a test email to verify that the email system is working correctly.</p>
          <p>If you received this email, your email configuration is working!</p>
          <p>- The DhanSetu Team</p>
        </div>
      `
    );

    if (sent) {
      console.log(`Test email successfully sent to ${email}`);
      return NextResponse.json({
        success: true,
        message: "Test email sent successfully",
      });
    } else {
      console.error(`Failed to send test email to ${email}`);
      return NextResponse.json(
        { error: "Failed to send test email. Check server logs for details." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Email test error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
