import nodemailer from 'nodemailer';

const sendEmail = async (options )=> {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.SMTP_EMAIL,
    to: options.email,
    subject: options.subject,
    html: options.message
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

export default sendEmail;
// Helper function to send OTP via email
// const sendOTPEmail = async (email, otp) => {
//   // Make sure credentials are available
//   if (!emailUser || !emailPass) {
//     throw new Error("Email credentials not configured");
//   }
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: emailUser,
//       pass: emailPass,
//     },
//   });

//   const mailOptions = {
//     from: emailUser,
//     to: email,
//     subject: "Your OTP for Login",
//     text: `Your OTP is ${otp}. It will expire in 15 minutes.`,
//   };
//   try {
//     const info = await transporter.sendMail(mailOptions);
//     return info;
//   } catch (error) {
//     console.error(`Failed to send email to ${email}:`, error);
//     throw error;
//   }
// };