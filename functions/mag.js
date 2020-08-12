const request = require('request-promise');

module.exports =  {

    run : function(data, functions, admin) {

        //let config = functions.config().portal.integracoes.previdenciadigital   
        if (!data.body) { 
            return {sucesso: false, response: null, erro: 'Objeto body inexistente' }
        }  

        return connectToken().then((token) => {
            console.log('======> token', token)
            let header = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
            console.log('======> data.body', data.body)
            let options = {
                url: config[data.url],
                method: data.metodo,
                headers: header,
                body: JSON.stringify(data.body)            
            }

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
       
    }
}

   

async function connectToken() {       
    let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)
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
    const configMAG = {
        client_id = '06b6e659-e395-4c27-aa98-e6faaca50c07',
        client_secret = 'jWV93z7PaCU9iRZW',
        urlstg = 'https://apis-stg.mag.com.br'
    }
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
    let retToken
    return request(options)
    .then((token) => {
        retToken = JSON.parse(token)
        let ref = admin.database().ref(`usuarios/shared/apiMAG/accessToken`)
        var dateNow =  new Date()
        return ref.update({valor: retToken, data_validade: new Date(dateNow.getTime()+1000*60*60*24)})
    }).then(() => {
        console.log('=====> retToken', retToken)
        return retToken
    }).catch((e) => {        
        return {erro: e}
    })
}