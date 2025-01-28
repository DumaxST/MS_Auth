const resetPasswordEs = (email, link) => {
    return{
        to: [email],
      message: {
          subject: "Restablecer contraseña",
          html: `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Restablecer contraseña</title>
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
                          background-color: #E3F3E3
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
                      .reset-link {
                        display: inline-block;
                        padding: 10px 20px;
                        margin: 20px 0;
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffffff !important; 
                        background-color: #4CAF50;
                        border-radius: 5px;
                        text-decoration: none;
                    }
                    .reset-link:hover {
                        background-color: #3F8D41; 
                        cursor: pointer;
                    }
                      .footer {
                          text-align: center;
                          padding: 10px 0;
                          border-top: 1px solid #dddddd;
                          font-size: 12px;
                          color: #777;
                          background-color: #E3F3E3
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>Restablecer contraseña</h1>
                      </div>
                      <div class="content">
                          <p>Hola,</p>
                          <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
                          <a href="${link}" class="reset-link">Restablecer contraseña</a>
                          <p>Si no solicitaste este cambio, por favor ignora este correo.</p>
                      </div>
                      <div class="footer">
                          <p>&copy; ${new Date().getFullYear()} Dumax. Todos los derechos reservados.</p>
                      </div>
                  </div>
              </body>
              </html>
          `,
      },
      attachments: [],
    }
}

const resetPasswordEn = (email, link) => {
    return{
        to: [email],
      message: {
          subject: "Reset password",
          html: `
              <!DOCTYPE html>
              <html lang="es">
              <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Reset password</title>
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
                          background-color: #E3F3E3
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
                      .reset-link {
                        display: inline-block;
                        padding: 10px 20px;
                        margin: 20px 0;
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffffff !important; 
                        background-color: #4CAF50;
                        border-radius: 5px;
                        text-decoration: none;
                    }
                    .reset-link:hover {
                        background-color: #3F8D41; 
                        cursor: pointer;
                    }
                      .footer {
                          text-align: center;
                          padding: 10px 0;
                          border-top: 1px solid #dddddd;
                          font-size: 12px;
                          color: #777;
                          background-color: #E3F3E3
                      }
                  </style>
              </head>
              <body>
                  <div class="container">
                      <div class="header">
                          <h1>Reset password</h1>
                      </div>
                      <div class="content">
                          <p>To reset your password, click on the link below:</p>
                          <a href="${link}" class="reset-link">Reset password</a>
                          <p>If you didn't request this change, please disregard this email.</p>
                      </div>
                      <div class="footer">
                          <p>&copy; ${new Date().getFullYear()} Dumax. All rights reserved.</p>
                      </div>
                  </div>
              </body>
              </html>
          `,
      },
      attachments: [],
    }
}

module.exports = {
    resetPasswordEs,
    resetPasswordEn
};