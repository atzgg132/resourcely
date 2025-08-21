import nodemailer from 'nodemailer';

// This interface defines the structure for our email options
export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

// This function will be called once when the server starts
async function createTestTransporter() {
  // Ethereal creates a free, temporary SMTP inbox for testing
  const testAccount = await nodemailer.createTestAccount();

  console.log(' ethereal mail user: ', testAccount.user);
  console.log(' ethereal mail pass: ', testAccount.pass);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });

  return transporter;
}

let transporter: nodemailer.Transporter;

// We initialize the transporter when the module is first loaded
(async () => {
    transporter = await createTestTransporter();
})();


export async function sendEmail(options: MailOptions) {
  if (!transporter) {
    console.error('Email transporter is not initialized yet.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Makerspace Scheduler" <noreply@makerspace.com>', // sender address
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Message sent: %s', info.messageId);
    // Preview URL will be available only with an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
}