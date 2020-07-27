'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request-promise');

const axios = require('axios')

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

let urlPrevidenciaDigital
let headerPrevidenciaDigital = {
    'Content-Type': 'application/json'
}
let bodyPrevidenciaDigital = {
    email: '',
    password: '',
    returnSecureToken: true
}

exports.default = functions.https.onCall((data, context) => {
    console.log('#apiPrevidenciaDigital - iniciando...')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}

    let config = functions.config().portal.integracoes.previdenciadigital
    urlPrevidenciaDigital = config.urlauth
    bodyPrevidenciaDigital.email = config.emailauth
    bodyPrevidenciaDigital.password = config.password
    let options = {
        url: urlPrevidenciaDigital,
        method: 'POST',
        headers: headerPrevidenciaDigital,
        body: JSON.stringify(bodyPrevidenciaDigital)
    }
    //primeiro: request para google api rest auth
    return request(options).then((pdResponse) => {
        pdResponse = JSON.parse(pdResponse)
        console.log('======> pdResponse.idToken', pdResponse.idToken)
        headerPrevidenciaDigital['Authorization'] = 'Bearer '+pdResponse.idToken
        let url = config[data.idApi]
        options = {
            url: url,
            method: 'POST',
            headers: headerPrevidenciaDigital,
            body: JSON.stringify(bodyPrevidenciaDigital)
        }
        //request para a api da previdencia digital solicitada
        return request(options)
    }).then((response) => {
        //console.log('#apiPrevidenciaDigital - chamada para pD - response', response)
        if (response) {
            return {sucesso: true, response: response.data, erro: null}
        } else {
            return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        }      
    }).catch((error) => {
        console.error(`#apiPrevidenciaDigital - Erro na na chamada a ${data.url} - erro:`, error)
        return {sucesso: false, response: null, erro: error}
    })        
})

/*
    return axios.post(urlPrevidenciaDigital, bodyPrevidenciaDigital, headerPrevidenciaDigital)
    .then((pdResponse) => {

        console.log('#apiPrevidenciaDigital - autenticação - pdResponse', pdResponse)

        headerPrevidenciaDigital['Authorization'] = 'Bearer '+pdResponse.refreshToken
        let url = config[data.idApi]
        return axios.post(url, data.objeto)
    }).then(response => {
        console.log('#apiPrevidenciaDigital - chamada para pD - response', response)
        if (response) {
            return {sucesso: true, response: null, erro: null}
        }                                    
        return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
    }).catch(error => {
        console.error(`#apiPrevidenciaDigital - Erro na na chamada a ${data.url} - erro:`, error)
        return {sucesso: false, response: null, erro: error}
    })     

})


*/