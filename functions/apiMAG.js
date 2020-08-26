'use strict'

const functions = require('firebase-functions')
require("firebase-functions/lib/logger/compat")
const admin = require('firebase-admin')
const request = require('request-promise')
const utils = require('./utilsFunctions')
const jwt = require('jsonwebtoken')

const configMAG = {
    client_id: '06b6e659-e395-4c27-aa98-e6faaca50c07',
    client_secret: 'jWV93z7PaCU9iRZW',
    urlauth: 'https://apis-stg.mag.com.br',
    simulacao: 'https://apis-stg.mag.com.br/apiseguradora/v2/simulacao?cnpj=11321351000110&codigoModeloProposta=YZ',
    questionario: 'https://apis-stg.mag.com.br/apiseguradora/v2/modeloproposta/YZ?cnpj=11321351000110&completo=true&version=1',
    proposta: 'https://apis-stg.mag.com.br/'
}

try {
    admin.initializeApp();
} catch (e) { 
    console.error('Erro ao inicializar o firebase', e) 
}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

exports.default = functions.runWith(runtimeOpts).https.onCall((data, context) => {    
    console.log('#apiMAG - iniciando!!!!')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}
    if (!data.body) return {sucesso: false, response: null, erro: 'Objeto body inexistente' }
    console.log('#apiMAG - chamando connectToken - Body: ', data.body)
    return connectToken().then((token) => {
        //console.log('#apiMAG - connectToken - token: ', token)
        let header = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
        var options = {
            'method': data.metodo,
            'url': configMAG[data.idApi],
            'headers': header,
            'body': JSON.stringify(data.body)
        }
        console.log('#apiMAG - options:::::::::>>> ', options)        
        return request(options)
    }).then((response) => {
        console.log('#apiMAG - request simulação - response', response)
        if (response) {
            return {sucesso: true, response: response, erro: null}
        } else {
            return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        }      
    }).catch((error) => {
        return {sucesso: false, response: null, erro: error}
    }) 
})

async function connectToken() {       
    let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)    
    return ref.once('value').then((data) => {        
        if (data.val()) {            
            let ret = data.val()   
            console.log('validateToken ========>',validateToken(ret.access_token))         
            if (validateToken(ret.access_token)) {                 
                return ret.access_token
            } else {                        
                return newToken()
            }          
        } else {            
            return newToken()
        }
    }).catch((e) => {      
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
    return request(options)
    .then((token) => {        
        retToken = JSON.parse(token)
        let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)        
        return ref.update( {access_token: retToken.access_token} )
    }).then(() => {        
        return retToken.access_token
    }).catch((e) => {  
        console.log('====> Erro: ', e)      
        return {erro: e}
    })
}

function validateToken(token) {
    const header = jwt.decode(token)
    const now = Math.floor(Date.now() / 1000)
    return header && header.exp > now
}

