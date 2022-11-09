const sgMail = require('@sendgrid/mail')
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

let sendPasswordRestEmail = async(email, token, callback) => {
    try {
        const msg = {
          to: `${email}`,
          from: 'noreply@animet.tv',
          subject: 'AnimetTV Password Reset',
          html: `<!DOCTYPE html>
          <html>
              <head>
                  <title>AnimetTV | Email Verification</title>
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                  <style type="text/css"> #outlook a{padding: 0;}.ReadMsgBody{width: 100%;}.ExternalClass{width: 100%;}.ExternalClass *{line-height:100%;}body{margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}table, td{border-collapse:collapse;}img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}p{display: block; margin: 13px 0;}</style>
                  <style type="text/css"> @media only screen and (max-width:480px){@-ms-viewport{width:320px;}@viewport{width:320px;}}</style>
                  <style type="text/css"> @media only screen and (min-width:480px){.mj-column-per-100, * [aria-labelledby="mj-column-per-100"]{width:100%!important;}}</style>
              </head>
              <body style="background: #121212;">
                  <div style="background-color:#121212;">
                  <style type="text/css"> html, body, *{-webkit-text-size-adjust: none; text-size-adjust: none;}a{color:#1EB0F4; text-decoration:none;}a:hover{text-decoration:underline;}</style>
                  <div style="margin:0px auto;max-width:640px;background:transparent;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0">
                          <tbody>
                              <tr>
                                  <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:40px 0px;">
                                      <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                              <tbody>
                                                  <tr>
                                                      <td style="word-break:break-word;font-size:0px;padding:0px;" align="center">
                                                          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0">
                                                              <tbody>
                                                                  <tr>
                                                                      <td style="width:150px;"><a href="" target="_blank"><img alt="" title="" height="25x" src="https://frosty-snyder-1df076.netlify.app/other/animet_logo.png" style="border:none;border-radius:4px;display:block;outline:none;text-decoration:none;width:100%;height:30px;" width="400"></a></td>
                                                                  </tr>
                                                              </tbody>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <div style="max-width:640px;margin:0 auto;box-shadow:0px 1px 5px rgba(0,0,0,0.1);border-radius:4px;overflow:hidden">
                      <div style="margin:0px auto;max-width:640px;background:#1F1F1F url(cdn) top center / cover no-repeat;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:#1E1E1E url(dsadas) top center / cover no-repeat;" align="center" border="0" background="">
                              <tbody>
                                  <tr>
                                      <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:57px;">
                                          <div style="cursor:auto;color:white;font-family:Verdana, Geneva, sans-serif;;font-size:36px;font-weight:600;line-height:36px;text-align:center;">Password Change Requested!</div>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                      <div style="margin:0px auto;max-width:640px;background:#ffffff;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:#ffffff;" align="center" border="0">
                          <tbody>
                              <tr>
                                  <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:40px 70px;">
                                      <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                              <tbody>
                                                  <tr>
                                                      <td style="word-break:break-word;font-size:0px;padding:0px 0px 20px;" align="left">
                                                          <div style="cursor:auto;color:#737F8D;font-family:Verdana, Geneva, sans-serif;font-size:16px;line-height:24px;text-align:left;">
                                                              <h2 style="font-family:Verdana, Geneva, sans-serif;font-weight: 500;font-size: 20px;color: #4F545C;letter-spacing: 0.27px;text-decoration: none; ">Hi ${email},</h2>
                                                              <p>Forgot your password?</p>
                                                              <p>We received a request to reset the password for your account.</p>
                                                          </div>
                                                      </td>
                                                  </tr>
                                                  <tr>
                                                      <td style="word-break:break-word;font-size:0px;padding:10px 25px;" align="center">
                                                          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:separate;" align="center" border="0">
                                                              <tbody>
                                                                  <tr>
                                                                      <td style="border:none;border-radius:3px;color:white;cursor:auto;padding:15px 19px;" align="center" valign="middle" bgcolor="#121212"><a href="${token}" style="text-decoration:none;line-height:100%;background:#121212;color:white;font-family:Verdana, Geneva, sans-serif;font-size:15px;font-weight:normal;text-transform:none;margin:0px;" target="_blank"> Reset password </a></td>
                                                                    </tr>
                                                              </tbody>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </tbody>
                                          </table>

                                          <p style="font-family:Verdana, Geneva, sans-serif;font-weight: 500;font-size: 16px;color: #4F545C;letter-spacing: 0.27px;text-decoration: none; ">Or copy and past the URL into your browser: ${token}</p>
                                      </div>
                      </div>
                      <div style="margin:0px auto;max-width:640px;background:transparent;"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"><tbody><tr><td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:0px;"><div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="word-break:break-word;font-size:0px;"><div style="font-size:1px;line-height:12px;">&nbsp;</div></td></tr></tbody></table></div></td></tr></tbody></table></div><div style="margin:0px auto;max-width:640px;background:transparent;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> Sent by AnimetTV </div></td></tr></tbody> </table> </div></td></tr></tbody> </table> </div><div style="margin:0px auto;max-width:640px;background:transparent;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> <a href="https://discord.gg/nNY94AqFtK" style="color:#1EB0F4;text-decoration:none;" target="_blank">Discord Server</a> • <a href="https://twitter.com/animet_tv" style="color:#1EB0F4;text-decoration:none;" target="_blank">Twitter</a> • <a href="https://www.tiktok.com/@animet_tv" style="color:#1EB0F4;text-decoration:none;" target="_blank">TikTok</a> </div></td></tr><tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> Watch Anime for Free ©2021 AnimetTV All Rights Reserved. <br>Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated third parties. </div></td></tr></tbody> </table> </div></td></tr></tbody> </table> </div>
                  </div>
              </body>
          </html>`,
        }
        sgMail
          .send(msg)
          .then(() => {
            console.log('Email sent');
            callback(null, true);
          })
          .catch((error) => {
            console.error(error);
            callback(null, false);
          })
    } catch (error) {
        console.log(error);
    }
}


let sendPasswordChangedEmail = async(email, callback) => {
    try {
        const msg = {
          to: `${email}`, 
          from: 'noreply@animet.tv',
          subject: 'AnimetTV Your password has been changed',
          html: `<!DOCTYPE html>
          <html>
              <head>
                  <title>AnimetTV | Email Verification</title>
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                  <style type="text/css"> #outlook a{padding: 0;}.ReadMsgBody{width: 100%;}.ExternalClass{width: 100%;}.ExternalClass *{line-height:100%;}body{margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;}table, td{border-collapse:collapse;}img{border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic;}p{display: block; margin: 13px 0;}</style>
                  <style type="text/css"> @media only screen and (max-width:480px){@-ms-viewport{width:320px;}@viewport{width:320px;}}</style>
                  <style type="text/css"> @media only screen and (min-width:480px){.mj-column-per-100, * [aria-labelledby="mj-column-per-100"]{width:100%!important;}}</style>
              </head>
              <body style="background: #121212;">
                  <div style="background-color:#121212;">
                  <style type="text/css"> html, body, *{-webkit-text-size-adjust: none; text-size-adjust: none;}a{color:#1EB0F4; text-decoration:none;}a:hover{text-decoration:underline;}</style>
                  <div style="margin:0px auto;max-width:640px;background:transparent;">
                      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0">
                          <tbody>
                              <tr>
                                  <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:40px 0px;">
                                      <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                              <tbody>
                                                  <tr>
                                                      <td style="word-break:break-word;font-size:0px;padding:0px;" align="center">
                                                          <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-spacing:0px;" align="center" border="0">
                                                              <tbody>
                                                                  <tr>
                                                                      <td style="width:150px;"><a href="" target="_blank"><img alt="" title="" height="25x" src="https://frosty-snyder-1df076.netlify.app/other/animet_logo.png" style="border:none;border-radius:4px;display:block;outline:none;text-decoration:none;width:100%;height:30px;" width="400"></a></td>
                                                                  </tr>
                                                              </tbody>
                                                          </table>
                                                      </td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </div>
                                  </td>
                              </tr>
                          </tbody>
                      </table>
                  </div>
                  <div style="max-width:640px;margin:0 auto;box-shadow:0px 1px 5px rgba(0,0,0,0.1);border-radius:4px;overflow:hidden">
                      <div style="margin:0px auto;max-width:640px;background:#1F1F1F url(cdn) top center / cover no-repeat;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:#1E1E1E url(dsadas) top center / cover no-repeat;" align="center" border="0" background="">
                              <tbody>
                                  <tr>
                                      <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:57px;">
                                          <div style="cursor:auto;color:white;font-family:Verdana, Geneva, sans-serif;;font-size:36px;font-weight:600;line-height:36px;text-align:center;">Confirmation</div>
                                      </td>
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                      <div style="margin:0px auto;max-width:640px;background:#ffffff;">
                          <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:#ffffff;" align="center" border="0">
                          <tbody>
                              <tr>
                                  <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:40px 70px;">
                                      <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0">
                                              <tbody>
                                                  <tr>
                                                      <td style="word-break:break-word;font-size:0px;padding:0px 0px 20px;" align="left">
                                                          <div style="cursor:auto;color:#737F8D;font-family:Verdana, Geneva, sans-serif;font-size:16px;line-height:24px;text-align:left;">
                                                              <h2 style="font-family:Verdana, Geneva, sans-serif;font-weight: 500;font-size: 20px;color: #4F545C;letter-spacing: 0.27px;text-decoration: none; ">Hello ${email},</h2>
                                                              <p>Your password has been changed</p>
                                                              <p>This is a confirmation that the password for your account ${email} has just been changed.</p>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              </tbody>
                                          </table>
                                      </div>
                      </div>
                      <div style="margin:0px auto;max-width:640px;background:transparent;"><table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"><tbody><tr><td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:0px;"><div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"><table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"><tbody><tr><td style="word-break:break-word;font-size:0px;"><div style="font-size:1px;line-height:12px;">&nbsp;</div></td></tr></tbody></table></div></td></tr></tbody></table></div><div style="margin:0px auto;max-width:640px;background:transparent;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> Sent by AnimetTV </div></td></tr></tbody> </table> </div></td></tr></tbody> </table> </div><div style="margin:0px auto;max-width:640px;background:transparent;"> <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:0px;width:100%;background:transparent;" align="center" border="0"> <tbody> <tr> <td style="text-align:center;vertical-align:top;direction:ltr;font-size:0px;padding:20px 0px;"> <div aria-labelledby="mj-column-per-100" class="mj-column-per-100 outlook-group-fix" style="vertical-align:top;display:inline-block;direction:ltr;font-size:13px;text-align:left;width:100%;"> <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0"> <tbody> <tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> <a href="https://discord.gg/nNY94AqFtK" style="color:#1EB0F4;text-decoration:none;" target="_blank">Discord Server</a> • <a href="https://twitter.com/animet_tv" style="color:#1EB0F4;text-decoration:none;" target="_blank">Twitter</a> • <a href="https://www.tiktok.com/@animet_tv" style="color:#1EB0F4;text-decoration:none;" target="_blank">TikTok</a> </div></td></tr><tr> <td style="word-break:break-word;font-size:0px;padding:0px;" align="center"> <div style="cursor:auto;color:#99AAB5;font-family:Verdana, Geneva, sans-serif;font-size:12px;line-height:24px;text-align:center;"> Watch Anime for Free ©2021 AnimetTV All Rights Reserved. <br>Disclaimer: This site does not store any files on its server. All contents are provided by non-affiliated third parties. </div></td></tr></tbody> </table> </div></td></tr></tbody> </table> </div>
                  </div>
              </body>
          </html>`,
        }
        sgMail
          .send(msg)
          .then(() => {
            console.log('Email sent');
            callback(null, true);
          })
          .catch((error) => {
            console.error(error);
            callback(null, false);
          })
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    sendPasswordRestEmail,
    sendPasswordChangedEmail
}