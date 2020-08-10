'use strict';
const functions = require('firebase-functions');
require("firebase-functions/lib/logger/compat");
const admin = require('firebase-admin');
const previdenciaDigital = require('./previdenciaDigital.js')

try {
  admin.initializeApp();
} catch (e) {}


const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '2GB'
}

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_base_cargaPD').onWrite(
    async (change, context) => {

    console.log('#pgCarga - iniciando.')

    if (!change.after.exists() || change.after.val()=='') {
        return
    }
    
    let listaUsuarios = []
    let plano = context.params.plano
    let ref = admin.database().ref('usuarios')
    return ref.orderByChild('home/usr_plano').equalTo(plano).once('value')
    .then((usuarios) => {
        //let i = 0
        usuarios.forEach((usr) => {
            let usuario = {
                chave: usr.key,
                cadastro: usr.val().data ? usr.val().data.cadastro : null,
                valores: usr.val().data ? usr.val().data.valores : null
            }
            listaUsuarios.push(usuario)
        })

        //console.log('=====> BODY:', JSON.stringify(listaUsuarios))
        //ref = admin.database().ref('teste')
        //ref.update(listaUsuarios)

        //atualiza previdencia digital
        console.log('#previdenciaDigitalCarga - chamando apiPrevidenciaDigital')
        return previdenciaDigital.run(
            {idApi: 'carga', body: listaUsuarios, metodo: 'POST'},
            functions, 
            admin
            )
    }).then((ret) => {          
        console.log('====> response:', ret)                       
        if (!ret.sucesso) {
            throw 'Erro em apiPrevidenciaDigital: '+ret.erro 
        } else {                    
            console.log('#previdenciaDigitalCarga - response obtido:', ret.response)
            console.log('#previdenciaDigitalCarga - Processamento realizado com sucesso.')
        }
        return true
    }).catch((error) => {
        console.error('#previdenciaDigitalCarga - Erro: ', error)
        return false
    })

})




