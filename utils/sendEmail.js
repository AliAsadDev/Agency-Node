const nodemailer = require("nodemailer");
const sgTransport = require("nodemailer-sendgrid-transport");

const SendEmail = async (options) => {
  // const transporter = nodemailer.createTransport({
  // 	host: process.env.SMTP_HOST,
  // 	port: process.env.SMTP_PORT,
  // 	auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  // });

  const transporter = nodemailer.createTransport(
    sgTransport({
      auth: {
        api_key:
          "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",
      },
    })
  );

  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  const info = await transporter.sendMail(message);

  console.log("Email sent successfully: %s", info.message);
};

module.exports = SendEmail;
