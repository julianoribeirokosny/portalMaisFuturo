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
        /*let chave = key.split("").reverse().join(""); //desinverte..
        let uid = chave.substring(0, chave.length - 14)
        let dataChave = chave.substring(chave.length - 14)
        console.log('=====> chave, uid, dataChave', chave, uid, dataChave)
        console.log(`#validaEmailLinkKey - validando link para o uid: ${uid}.`)
        let ref = admin.database().ref(`login/${uid}/emailLinkKey`)
        return ref.once('value').then((emailLinkKey) => {
            if (emailLinkKey.val()===null) {
                console.log(`#validaEmailLinkKey - erro na validação do link para o uid: ${uid} - Chave não encontrada.`)
                res.status(401).send("Ops! Parece que este link não é mais válido. Retorne ao aplicativo e solicite um novo envio de e-mail.")
                return false    
            }
            console.log('====> emailLinkKey, key',emailLinkKey.val(), key, emailLinkKey.val() === key)
            if (emailLinkKey.val() !== key){
                console.log(`#validaEmailLinkKey - erro na validação do link para o uid: ${uid} - Chave não bate.`)
                res.status(401).send("Ops! Parece que este link não é mais válido. Retorne ao aplicativo e solicite um novo envio de e-mail.")
                return false    
            } */
        return admin.auth().verifyIdToken(idToken)
        .then(function(decodedToken) {
          return decodedToken.uid;
          // ...
        }).then((uid) => {
            //atualiza EmailVerified para true
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