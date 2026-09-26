import { createTransport } from "nodemailer";

export const sendMail = async ({email, subject, html})=>{
    const transporter = createTransport({
        host: "smtp.gmail.com",
        port: 465,
        auth:{
            user:process.env.smtp_user,
            pass:process.env.smtp_password
        },
    });
    await transporter.sendMail({
        from: process.env.smtp_user,
        to: email,
        subject: subject,
        html: html
    })
}