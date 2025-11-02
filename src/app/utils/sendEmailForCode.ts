import nodemailer from "nodemailer";

export const sendEmailForCode = async ({ to, subject, text }: any) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.APP_USER_EMAIL,
      pass: process.env.APP_PASSWORD,
    },
  });

  // console.log("transport ", transporter);

  await transporter.sendMail({
    from: `"" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
  });
};
