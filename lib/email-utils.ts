// lib/email-utils.ts
import nodemailer from "nodemailer";
import { User, Request as LoanRequest } from "./types";

// Format currency in Indian Rupees
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// Configure nodemailer transporter
const createTransporter = () => {
  // For production, use environment variables
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Core email sending function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"DhanSetu" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

// Notification when a new request is created
export const sendNewRequestNotification = async (
  requester: User,
  request: LoanRequest
): Promise<boolean> => {
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const subject = `Your ${requestType} Request Has Been Submitted`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${requester.name},</h2>
      <p>Your ${
        request.type
      } request has been successfully submitted to the DhanSetu platform.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        ${
          request.title ? `<p><strong>Title:</strong> ${request.title}</p>` : ""
        }
        ${
          request.category
            ? `<p><strong>Category:</strong> ${request.category}</p>`
            : ""
        }
        <p><strong>Amount:</strong> ${formatINR(request.amount)}</p>
        <p><strong>Details:</strong> ${request.details}</p>
        <p><strong>Status:</strong> Pending</p>
        <p><strong>Votes Required:</strong> ${request.votesRequired}</p>
      </div>
      
      <p>Your request now requires community approval. You'll be notified when there are updates.</p>
      
      <p>Thank you for using the DhanSetu platform!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(requester.email, subject, html);
};

// Notification when a request is approved/rejected
export const sendRequestStatusUpdateNotification = async (
  requester: User,
  request: LoanRequest
): Promise<boolean> => {
  const status =
    request.status.charAt(0).toUpperCase() + request.status.slice(1);
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const subject = `Your ${requestType} Request Has Been ${status}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${requester.name},</h2>
      <p>Your ${request.type} request has been <strong>${
    request.status
  }</strong> by the DhanSetu community.</p>
      
      <div style="background-color: ${
        request.status === "approved" ? "#e6f7e6" : "#ffebee"
      }; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: ${
          request.status === "approved" ? "#2e7d32" : "#c62828"
        };">Request ${status}</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        ${
          request.title ? `<p><strong>Title:</strong> ${request.title}</p>` : ""
        }
        ${
          request.category
            ? `<p><strong>Category:</strong> ${request.category}</p>`
            : ""
        }
        <p><strong>Amount:</strong> ${formatINR(request.amount)}</p>
        <p><strong>Details:</strong> ${request.details}</p>
        <p><strong>Approved by:</strong> ${
          request.approvedBy.length
        } members</p>
        <p><strong>Rejected by:</strong> ${
          request.rejectedBy.length
        } members</p>
      </div>
      
      ${
        request.status === "approved"
          ? `<p>Your account ${
              request.type === "loan"
                ? "has been credited with"
                : "has been debited"
            } ${formatINR(request.amount)}.</p>`
          : "<p>Unfortunately, your request did not receive enough community approval.</p>"
      }
      
      <p>Thank you for using the DhanSetu platform!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(requester.email, subject, html);
};

// Notification to community members when there's a new request to vote on
export const sendNewVotingRequestNotification = async (
  communityMember: User,
  request: LoanRequest,
  requesterName: string
): Promise<boolean> => {
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const subject = `New ${requestType} Request Requires Your Vote`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${communityMember.name},</h2>
      <p>A new ${
        request.type
      } request has been submitted by ${requesterName} and requires your vote.</p>
      
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Requester:</strong> ${requesterName}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        ${
          request.title ? `<p><strong>Title:</strong> ${request.title}</p>` : ""
        }
        ${
          request.category
            ? `<p><strong>Category:</strong> ${request.category}</p>`
            : ""
        }
        <p><strong>Amount:</strong> ${formatINR(request.amount)}</p>
        <p><strong>Details:</strong> ${request.details}</p>
        <p><strong>Votes Required:</strong> ${request.votesRequired}</p>
      </div>
      
      <p>Please log in to the DhanSetu platform to cast your vote on this request.</p>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="http://localhost:3000" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Log in to Vote</a>
      </div>
      
      <p>Thank you for your participation in the DhanSetu community!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(communityMember.email, subject, html);
};

// Notification when a member votes on a request
export const sendVoteReceivedNotification = async (
  requester: User,
  request: LoanRequest,
  voterName: string,
  voteType: "approve" | "reject"
): Promise<boolean> => {
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const voteAction = voteType === "approve" ? "approved" : "rejected";
  const subject = `New Vote on Your ${requestType} Request`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${requester.name},</h2>
      <p>${voterName} has ${voteAction} your ${request.type} request.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Current Voting Status:</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        <p><strong>Approved by:</strong> ${request.approvedBy.length} members</p>
        <p><strong>Rejected by:</strong> ${request.rejectedBy.length} members</p>
        <p><strong>Votes required for approval:</strong> ${request.votesRequired}</p>
      </div>
      
      <p>You will be notified when your request reaches a final decision.</p>
      
      <p>Thank you for using the DhanSetu platform!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(requester.email, subject, html);
};

// Notification to community members about request outcome
export const sendRequestOutcomeNotification = async (
  communityMember: User,
  request: LoanRequest,
  requesterName: string
): Promise<boolean> => {
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const subject = `${requestType} Request ${request.status.toUpperCase()}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${communityMember.name},</h2>
      <p>A ${
        request.type
      } request by ${requesterName} that you voted on has been ${
    request.status
  }.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Request Details:</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        ${
          request.title ? `<p><strong>Title:</strong> ${request.title}</p>` : ""
        }
        ${
          request.category
            ? `<p><strong>Category:</strong> ${request.category}</p>`
            : ""
        }
        <p><strong>Amount:</strong> ${formatINR(request.amount)}</p>
        <p><strong>Details:</strong> ${request.details}</p>
        <p><strong>Final Status:</strong> ${request.status.toUpperCase()}</p>
      </div>
      
      <p>Thank you for your participation in our community decision-making!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(communityMember.email, subject, html);
};

// Welcome email when a user registers
export const sendWelcomeEmail = async (user: User): Promise<boolean> => {
  const subject = `Welcome to DhanSetu Community Finance Platform`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to DhanSetu, ${user.name}!</h2>
      <p>Thank you for joining our community financial platform. Your account has been successfully created.</p>
      
      <div style="background-color: #e6f7ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Account Details:</h3>
        <p><strong>Name:</strong> ${user.name}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Member ID:</strong> ${user.id}</p>
        <p><strong>Initial Balance:</strong> ₹${user.accountBalance.toLocaleString(
          "en-IN"
        )}</p>
      </div>
      
      <p>With DhanSetu, you can:</p>
      <ul style="margin-left: 20px; line-height: 1.5;">
        <li>Request loans from the community</li>
        <li>Make deposits to the community fund</li>
        <li>Participate in community voting for loan approvals</li>
        <li>Build your credit score within the community</li>
      </ul>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="http://localhost:3000/dashboard" style="background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Go to My Dashboard</a>
      </div>
      
      <p>If you have any questions, please don't hesitate to contact our support team.</p>
      
      <p>Thank you for joining DhanSetu!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};

// Notification when a request is cancelled by the user
export const sendRequestCancellationNotification = async (
  user: User,
  request: LoanRequest
): Promise<boolean> => {
  const requestType =
    request.type.charAt(0).toUpperCase() + request.type.slice(1);
  const subject = `Your ${requestType} Request Has Been Cancelled`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      <p>Your ${request.type} request has been successfully cancelled.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Cancelled Request Details:</h3>
        <p><strong>Request ID:</strong> ${request.id}</p>
        <p><strong>Type:</strong> ${requestType}</p>
        ${
          request.title ? `<p><strong>Title:</strong> ${request.title}</p>` : ""
        }
        ${
          request.category
            ? `<p><strong>Category:</strong> ${request.category}</p>`
            : ""
        }
        <p><strong>Amount:</strong> ${formatINR(request.amount)}</p>
        <p><strong>Details:</strong> ${request.details}</p>
        <p><strong>Votes received before cancellation:</strong> ${
          request.approvedBy.length + request.rejectedBy.length
        }</p>
      </div>
      
      <p>You can submit a new request at any time from your dashboard.</p>
      
      <p>Thank you for using the DhanSetu platform!</p>
      <p>- The DhanSetu Team</p>
    </div>
  `;

  return sendEmail(user.email, subject, html);
};
