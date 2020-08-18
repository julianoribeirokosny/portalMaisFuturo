const request = require('request-promise');
  
module.exports =  {

    run : function(data, functions, admin) {
        let header = {
            'Content-Type': 'application/json'
        }
    
        let config = functions.config().portal.integracoes.previdenciadigital

        console.log('====> config', config)
        console.log('====> config', config)
    
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
    
    }
}
   
async function autenticaGoogle(config, admin) {
    let urlPrevidenciaDigital
    let headerPrevidenciaDigital = {
        'Content-Type': 'application/json'
    }
    let bodyPrevidenciaDigital = {
        email: '',
        password: '',
        returnSecureToken: true
    }
    
    urlPrevidenciaDigital = config.urlauth
    bodyPrevidenciaDigital.email = config.emailauth
    bodyPrevidenciaDigital.password = config.password
    let options = {
        url: urlPrevidenciaDigital,
        method: 'POST',
        headers: headerPrevidenciaDigital,
        body: JSON.stringify(bodyPrevidenciaDigital)
    }
    return request(options).then((pdResponse) => {
        pdResponse = JSON.parse(pdResponse)
        let ref = admin.database().ref(`usuarios/shared/apiPrevidenciaDigital`)
        ref.update({accessToken: pdResponse})
        console.log('=====> pdResponse', pdResponse)
        return {idToken: pdResponse.idToken, erro: null}
    }).catch((e) => {
        let ref = admin.database().ref(`usuarios/shared/apiPrevidenciaDigital/accessToken`)
        return ref.once('value').then((accessToken) => {
            console.log('=====> erro:', e)
            console.log('=====> accessToken', accessToken)
            if (accessToken) {
                return {idToken: accessToken.idToken, erro: e} //retorna tanto o token da base quanto o erro
            } else {
                return {idToken: null, erro: e}
            }
        })
    })
}
