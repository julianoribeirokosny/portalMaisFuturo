'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const email = require('./email');

try {
  admin.initializeApp();
} catch (e) {}


exports.default = functions.database.ref('login/{uid}/emails/{dataEnvio}')
  .onWrite((change, context) => {

    if (!change.after.exists() || change.after.val()==='') {
        console.log('#solicitaEnvioEmail - campo excluído ou apagado. Nenhum email enviado.')
        return false
    }   

    let dadosEmail = change.after.val()
    console.log('====> dadosEmail', dadosEmail)
    if (!dadosEmail.emailDestinatario || !dadosEmail.assunto || (!dadosEmail.corpo && !dadosEmail.corpoHtml)) {
        console.log('#solicitaEnvioEmail - há campos faltando para montagem do email. Nenhum email enviado.')
        return false
    }

    console.log('#solicitaEnvioEmail - enviando email para o usuário: ', context.params.uid)

    return email.enviarEmail(dadosEmail.assunto, dadosEmail.emailDestinatario, dadosEmail.corpo, dadosEmail.corpoHtml)
    .then((ret) => {
        if (!ret) {
            console.log('#solicitaEnvioEmail - erro no envio de email para usuário: '+context.params.uid, '. Veja mensagens anteriores.')
        }
        return ret
    }).catch((e) => {
        console.error('#solicitaEnvioEmail - Erro no envio de email para o usuário:', context.params.uid, ' - erro: ', e)
    })
});
