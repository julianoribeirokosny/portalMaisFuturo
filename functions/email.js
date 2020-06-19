const nodemailer = require('nodemailer');
const gmailEmail = 'previdenciadigital@maisfuturo.com.br'; //functions.config().gmail.email;
const gmailPassword = '159+++ert'; //functions.config().gmail.password;
const mailTransport = nodemailer.createTransport({
    host: 'previdenciadigital@grupojmalucelli.onmicrosoft.com',
    port: 587,
    secure: false,
    requireTLS: true,
    //service: 'gmail',
    auth: {
        user: gmailEmail,
        pass: gmailPassword,
    },
});

module.exports =  {

    enviarEmail : function (assunto, destinatarios, corpo, corpoHtml) {
        let remetente = 'naoresponda@maisfuturo.com.br'
        let email = {
            //from: remetente,
            sender: remetente,
            to: destinatarios,
            subject: assunto,
            text: corpo,
            html: corpoHtml
        };

        console.log('====> email', email)
        return mailTransport.sendMail(email).then((info) => {
            console.log('#email - Mensagem %s enviada para %s: %s', info.messageId, email, info.response);
            return true;
        }).catch((error) => {
            console.error("#email - Erro no envio de email:", error);
            return false;            
        })
    }
}