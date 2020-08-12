const request = require('request-promise');

const configMAG = {
    client_id = '06b6e659-e395-4c27-aa98-e6faaca50c07',
    client_secret = 'jWV93z7PaCU9iRZW',
    urlstg = 'https://apis-stg.mag.com.br'
}

module.exports =  {

    run : function(data, functions, admin) {

        //let config = functions.config().portal.integracoes.previdenciadigital   
        
        return connectToken().then((token) => {
        //     console.log('======> token', token)
        //     header['Authorization'] = `Bearer ${token}`
        //     console.log('======> data.body', data.body)
        //     let options = {
        //         url: config[data.url],
        //         method: data.metodo,
        //         headers: header
        //     }
        //     if (data.body) { 
        //         options['body'] = JSON.stringify(data.body)            
        //     }  

        //     return request(options)
        // }).then((response) => {
        //     console.log('#apiMAG - chamada para pD - response', response)
        //     if (response) {
        //         return {sucesso: true, response: response, erro: null}
        //     } else {
        //         return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        //     }      
        // }).catch((error) => {
        //     console.error(`#apiMAG - Erro na na chamada a ${config[data.idApi]} - erro:`, error)
        //     return {sucesso: false, response: null, erro: error}
        // })        
        let header = {
            'Content-Type': 'application/json'
        }
    
        let config = functions.config().portal.integracoes.previdenciadigital
    
        //primeiro: request para google api rest auth
        return autenticaGoogle(config, admin).then((ret) => {
            console.log('======> ret', ret)
            header['Authorization'] = 'Bearer '+ret.idToken
            console.log('======> data.body', JSON.stringify(data.body))
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
            console.log('#apiPrevidenciaDigital - chamada para pD - response', response)
            if (response) {
                return {sucesso: true, response: response, erro: null}
            } else {
                return {sucesso: false, response: response, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
            }      
        }).catch((error) => {
            console.error(`#apiPrevidenciaDigital - Erro na na chamada a ${config[data.idApi]} - erro:`, error)
            return {sucesso: false, response: null, erro: error}
        })
        })
    }
}

   

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

// async function autenticaGoogle(config, admin) {
//     let urlPrevidenciaDigital
//     let headerPrevidenciaDigital = {
//         'Content-Type': 'application/json'
//     }
//     let bodyPrevidenciaDigital = {
//         email: '',
//         password: '',
//         returnSecureToken: true
//     }
    
//     urlPrevidenciaDigital = config.urlauth
//     bodyPrevidenciaDigital.email = config.emailauth
//     bodyPrevidenciaDigital.password = config.password
//     let options = {
//         url: urlPrevidenciaDigital,
//         method: 'POST',
//         headers: headerPrevidenciaDigital,
//         body: JSON.stringify(bodyPrevidenciaDigital)
//     }
//     return request(options).then((pdResponse) => {
//         pdResponse = JSON.parse(pdResponse)
//         let ref = admin.database().ref(`usuarios/shared/apiPrevidenciaDigital`)
//         ref.update({accessToken: pdResponse})
//         console.log('=====> pdResponse', pdResponse)
//         return {idToken: pdResponse.idToken, erro: null}
//     }).catch((e) => {
//         let ref = admin.database().ref(`usuarios/shared/apiPrevidenciaDigital/accessToken`)
//         return ref.once('value').then((accessToken) => {
//             console.log('=====> erro:', e)
//             console.log('=====> accessToken', accessToken)
//             if (accessToken) {
//                 return {idToken: accessToken.idToken, erro: e} //retorna tanto o token da base quanto o erro
//             } else {
//                 return {idToken: null, erro: e}
//             }
//         })
//     })
// }