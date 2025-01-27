const generateVerificationEmailEn = (email, user, verificationCode) => {
    return {
        to: [email],
        message: {
            subject: "Verification code",
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Verification code</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                            color: #333;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 10px 0;
                            border-bottom: 1px solid #dddddd;
                            background-color: #E3F3E3;
                        }
                        .header h1 {
                            margin: 0;
                            color: #333;
                        }
                        .content {
                            padding: 20px;
                            text-align: center;
                        }
                        .content p {
                            font-size: 16px;
                            line-height: 1.5;
                        }
                        .code {
                            display: inline-block;
                            padding: 5px 60px;
                            margin: 20px 0;
                            font-size: 24px;
                            font-weight: bold;
                            color: #ffffff;
                            background-color: #4CAF50;
                            border-radius: 5px;
                            text-decoration: none;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px 0;
                            border-top: 1px solid #dddddd;
                            font-size: 12px;
                            color: #777;
                            background-color: #E3F3E3;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Verification code</h1>
                        </div>
                        <div class="content">
                            <p>Hi ${user.displayName}!</p>
                            <p>This is your verification code:</p>
                            <a class="code">${verificationCode}</a>
                            <p>Please use this code to complete your verification process.</p>
                        </div>
                        <div class="footer">
                            <p>If you didn't request this code, please ignore this email.</p>
                            <p>&copy; ${new Date().getFullYear()} Dumax. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        },
        attachments: [],
    };
};

const generateVerificationEmailEs = (email, user, verificationCode) => {
    return {
        to: [email],
        message: {
            subject: "Código de verificación",
            html: `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Código de verificación</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                            color: #333;
                        }
                        .container {
                            width: 100%;
                            max-width: 600px;
                            margin: 0 auto;
                            background-color: #ffffff;
                            padding: 20px;
                            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            text-align: center;
                            padding: 10px 0;
                            border-bottom: 1px solid #dddddd;
                            background-color: #E3F3E3;
                        }
                        .header h1 {
                            margin: 0;
                            color: #333;
                        }
                        .content {
                            padding: 20px;
                            text-align: center;
                        }
                        .content p {
                            font-size: 16px;
                            line-height: 1.5;
                        }
                        .code {
                            display: inline-block;
                            padding: 5px 60px;
                            margin: 20px 0;
                            font-size: 24px;
                            font-weight: bold;
                            color: #ffffff;
                            background-color: #4CAF50;
                            border-radius: 5px;
                            text-decoration: none;
                        }
                        .footer {
                            text-align: center;
                            padding: 10px 0;
                            border-top: 1px solid #dddddd;
                            font-size: 12px;
                            color: #777;
                            background-color: #E3F3E3;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Código de verificación</h1>
                        </div>
                        <div class="content">
                            <p>Hola ${user.displayName}!</p>
                            <p>Este es tu código de verificación:</p>
                            <a class="code">${verificationCode}</a>
                            <p>Por favor, usa este código para completar tu proceso de verificación.</p>
                        </div>
                        <div class="footer">
                            <p>Si no solicitaste este código, por favor ignora este correo.</p>
                            <p>&copy; ${new Date().getFullYear()} Dumax. Todos los derechos reservados.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        },
        attachments: [],
    };
};


module.exports = {
    generateVerificationEmailEn,
    generateVerificationEmailEs
}