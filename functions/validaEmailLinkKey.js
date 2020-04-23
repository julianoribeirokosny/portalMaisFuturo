'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');

try {
  admin.initializeApp();
} catch (e) {}


exports.default = functions.https.onRequest((req, res) => {

    console.log(`#validaEmailLinkKey - iniciando...`)

    let idToken = req.query.k;
    if (!idToken) {
        console.log(`#validaEmailLinkKey - padrão de chamada do link inconsistente. Não foi detectada nenhuma chave.`)
        res.status(401).send("Ops! Parece que este link não é mais válido. Retorne ao aplicativo e solicite um novo envio de e-mail.")
        return false
    } else {
        console.log(`#validaEmailLinkKey - decode token...`)
        return admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
            console.log(`#validaEmailLinkKey - token válido.`)
            return decodedToken.uid;
        }).then((uid) => {
            //atualiza EmailVerified para true
            console.log(`#validaEmailLinkKey - atualizando usuários.`)
            return admin.auth().updateUser(uid, {
                emailVerified: true
            }).then((userData) => {
                // See the UserRecord reference doc for the contents of userRecord.
                console.log('#validaEmailLinkKey - emailVerified alterado para true para o uid:',uid);
                res.status(200).send("Pronto! Seu e-mail foi validado com sucesso. Pode retornar ao aplicativo e usar sem problemas")
                return true
            }).catch((error) => {
                console.log('#validaEmailLinkKey - erro ao alterar emailVerified o uid:',uid, error);
                res.status(401).send("Ops! Houve um erro na validação do seu e-mail. Por favor tente novamente. Caso o erro persista, entre em contato conosco através do e-mail contato@maisfuturo.com.br")
                return false
            });
        }).catch((e) => {
            console.error(`#validaEmailLinkKey - erro na validação do link.`, e)
            res.status(401).send("Ops! Parece que este link não é mais válido. Retorne ao aplicativo e solicite um novo envio de e-mail.")            
            return false
        })
    }
})