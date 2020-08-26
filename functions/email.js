const nodemailer = require('nodemailer');
const functions = require('firebase-functions');
const config = functions.config().portal
const user = config.smtp.auth.user
const pass = config.smtp.auth.pass
const host = config.smtp.host
const port = config.smtp.port
const requireTLS = config.smtp.requiretls
const mailTransport = nodemailer.createTransport({
    host: host, // email-smtp.us-east-1.amazonaws.com
    port: port, //587
    secure: false,
    requireTLS: requireTLS,
    auth: {
        user: user,
        pass: pass
    },
});

/*const mailTransport2 = nodemailer.createTransport({
    service: "Gmail",
    //host: host, // email-smtp.us-east-1.amazonaws.com
    //port: port, //587
    secure: false,
    requireTLS: requireTLS,
    auth: {
        user: "portalmaisfuturo@gmail.com",
        pass: ""
    },
});*/


module.exports =  {

    enviarEmail : function (assunto, destinatarios, corpo, corpoHtml) {
        console.log('==> enviando email...')
        let remetente = 'portalmaisfuturo@previdenciadigital.com.br'
        let email = {
            //from: remetente,
            sender: remetente,
            to: destinatarios,
            subject: assunto,
            text: corpo,
            html: corpoHtml
        };

        //console.log('#email - formato da requisição: ', JSON.stringify(email))

        /*mailTransport2.sendMail(email).then((info) => {
            console.log('#GMAIL - Mensagem %s enviada para %s: %s', info.messageId, email.to, info.response);
            return true;
        }).catch((error) => {
            console.error("#GMAIL - Erro no envio de email:", error);
            return false;            
        })*/

        return mailTransport.sendMail(email).then((info) => {
            //console.log('#email - Mensagem %s enviada para %s: %s', info.messageId, email.to, info.response);
            return true;
        }).catch((error) => {
            console.error("#email - Erro no envio de email:", error);
            return false;            
        })
    }
}