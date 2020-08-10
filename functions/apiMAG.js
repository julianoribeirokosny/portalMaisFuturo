'use strict'

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const request = require('request-promise')

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

const configMAG = {
    client_id = '06b6e659-e395-4c27-aa98-e6faaca50c07',
    client_secret = 'jWV93z7PaCU9iRZW',
    urlstg = 'https://apis-stg.mag.com.br'
}

exports.default = functions.https.onCall((data, context) => {
    console.log('#apiMAG - iniciando...')
    if (!context.auth) {
        return {status: 'error', code: 401, message: 'Not signed in'}
    }
    let header = {
        'Content-Type': 'application/json'
    }
    //let config = functions.config().portal.integracoes.previdenciadigital
    //let config = configMAG
    //primeiro: request para google api rest auth
    return connectToken().then((token) => {
        console.log('======> token', token)
        header['Authorization'] = `Bearer ${token}`
        console.log('======> data.body', data.body)
        let options = {
            url: config[data.idApi],
            method: data.metodo,
            headers: header
        }
        if (data.body) { 
            options['body'] = JSON.stringify(data.body)            
        }
        //request para a api da previdencia digital solicitada
        return request(options)
    }).then((response) => {
        console.log('#apiMAG - chamada para pD - response', response)
        if (response) {
            return {sucesso: true, response: response, erro: null}
        } else {
            return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        }      
    }).catch((error) => {
        console.error(`#apiMAG - Erro na na chamada a ${config[data.idApi]} - erro:`, error)
        return {sucesso: false, response: null, erro: error}
    })        
})

async function connectToken() {       
    let ref = admin.database().ref(`settings/simulador_seguro/apiMAG/token`)
    return ref.once('value').then((data) => {
        if (data.val()) {
            console.log('data.val()',data.val())
            let ret = data.val()
            let dateNow = new Date()
            if (ret.data_validade > dateNow) {
                return newToken()
            } else {
                return ret.valor
            }          
        } else {
            return newToken()
        }
    })
}

async function newToken() {
    let header = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    let body = {
        client_id: configMAG.client_id,
        client_secret: configMAG.client_secret,
        scope: 'apiseguradora',
        grant_type:'client_credentials'
    }      
    let options = {
        url: `${configMAG.urlstg}/connect/token`,
        method: 'POST',
        header: header,
        body: JSON.stringify(body)
    }    
    return request(options).then((token) => {
        token = JSON.parse(token)
        let ref = admin.database().ref(`settings/simulador_seguro/apiMAG/token`)
        var dateNow =  new Date()
        ref.update({
                        valor: token,
                        data_validade: new Date(dateNow.getTime()+1000*60*60*24)
                    })
        console.log('=====> token', token)
        return token
    }).catch((e) => {        
        return {erro: e}
    })
}
    


