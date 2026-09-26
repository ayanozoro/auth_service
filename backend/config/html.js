
export const getOpt = ({email, otp})=>{
    
    const html = `<p>Your OTP code is: ${otp}</p>`;
    return html;
}

export const getVerifyEmailHtml=({email, token})=>{
    const appUrl = process.env.app_name || "Auth App";
    const frontendUrl = process.env.frontend_url || "http://localhost:5173";
    const verifyUrl = `${frontendUrl.replace(/\/+$/, "")}/verify/${encodeURIComponent(token)}`;

    const html =`
    <html>
    <head>
        <title>Verify your email</title>
        </head>
        <body>
            <h1>Verify your email</h1>
            <p>Hi ${email},</p>
            <p>Thank you for registering with ${appUrl}. Please click the link below to verify your email address:</p>
            <a href="${verifyUrl}">Verify Email</a>
            <p>If you did not request this verification, please ignore this email.</p>
        </body>
    </html>
    `;
    return html;
}