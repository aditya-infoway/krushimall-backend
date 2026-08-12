import nodemailer from "nodemailer";
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
export const sendOTPEmail = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: `"krushi Mall" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Email Verification OTP",
            html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>krushi Mall</h2>
          <p>Hello,</p>
          <p>Your OTP for email verification is:</p>

          <h1 style="color:#2563eb;letter-spacing:5px;">
            ${otp}
          </h1>

          <p>This OTP is valid for <b>10 minutes</b>.</p>

          <p>Please do not share this OTP with anyone.</p>

          <br>

          <p>Thank you,<br>krushi Mall Team</p>
        </div>
      `,
        });
        console.log("✅ OTP email sent successfully");
    }
    catch (error) {
        console.error("❌ Email sending failed:", error);
        throw error;
    }
};
//# sourceMappingURL=sendEmail.js.map