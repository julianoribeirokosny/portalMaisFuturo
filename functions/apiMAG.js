'use strict'
const functions = require('firebase-functions')
require("firebase-functions/lib/logger/compat");
const admin = require('firebase-admin')
const request = require('request-promise');

const configMAG = {
  client_id: '06b6e659-e395-4c27-aa98-e6faaca50c07',
  client_secret: 'jWV93z7PaCU9iRZW',
  urlauth: 'https://apis-stg.mag.com.br',
  simulacao: 'https://apis-stg.mag.com.br/apiseguradora/v2/simulacao?cnpj=11321351000110&codigoModeloProposta=YZ'
}

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

exports.default = functions.https.onCall((data, context) => {    
    console.log('#apiMAG - iniciando!!!!')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}
    if (!data.body) { 
      return {sucesso: false, response: null, erro: 'Objeto body inexistente' }
    }  
    console.log('#apiMAG - chamando connectToken - Body: ', data.body)
    return connectToken().then((token) => {
        console.log('======> token', token)
        let header = {
            'Authorization': `Bearer ${token.access_token}`,
            'Content-Type': 'application/json'
        }
        console.log('======> data.body', data.body)
        console.log('======> header', header)

        var options = {
          'method': 'POST',
          'url': configMAG[data.idApi],
          'headers': header,
          'body': JSON.stringify(data.body)
        };

        console.log('======> options', options)

        return request(options)
    }).then((response) => {
        console.log('#apiMAG - chamada para pD - response', response)
        if (response) {
            return {sucesso: true, response: response, erro: null}
        } else {
            return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        }      
    }).catch((error) => {
        console.error(`#apiMAG - Erro na na chamada a ${configMAG[data.idApi]} - erro:`, error)
        return {sucesso: false, response: null, erro: error}
    }) 
})

async function connectToken() {       
    let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)
    console.log('======> buscando token no banco')
    return ref.once('value').then((data) => {
        console.log('======> data.val()', data.val())
        if (data.val()) {
            console.log('===> data.val()',data.val())
            let ret = data.val()
            let dateNow = new Date()
            if (ret.data_validade > dateNow) {
                console.log('====> chamando newToken()')
                return newToken()
            } else {
                console.log('====> Retornando ret.valor', ret.valor)
                return ret.valor
            }          
        } else {
            console.log('====> chamando newToken()  2')
            return newToken()
        }
    }).catch((e) => {
      console.log('====> Erro: ', e)  
      return false      
    })
}

async function newToken() {
    var options = {
      'method': 'POST',
      'url': `${configMAG.urlauth}/connect/token`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        'client_id': configMAG.client_id,
        'client_secret': configMAG.client_secret,
        'scope': 'apiseguradora',
        'grant_type': 'client_credentials'
      }
    }   

    let retToken
    console.log('====> Fazendo request de Token para MAG - options: ', options)
    return request(options)
    .then((token) => {
        console.log('====> retToken: ', retToken)
        retToken = JSON.parse(token)
        let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)
        var dateNow =  new Date()
        return ref.update({valor: retToken, data_validade: new Date(dateNow.getTime()+1000*60*60*24)})
    }).then(() => {
        console.log('=====> retToken 2', retToken)
        return retToken
    }).catch((e) => {  
        console.log('====> Erro: ', e)      
        return {erro: e}
    })
}

