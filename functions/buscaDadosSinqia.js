'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const request = require('request-promise');

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

const apisSinqiaPrd = {
    login: 'https://api-fundoparana.sinqia.com.br/api/acesso/login',
    obterCobrancasEmAberto: 'https://api-fundoparana.sinqia.com.br/api/v1/beneficio/adesao/obterCobrancasEmAberto/{{pCPF}}',
    obterListaAdesoes: 'https://api-fundoparana.sinqia.com.br/api/v1/beneficio/adesao/{{pCPF}}',
    obterCobrancasEmAtraso: 'https://api-fundoparana.sinqia.com.br/api/v1/beneficio/adesao/obterCobrancasEmAtraso/{{pIdAdesao}}'
}

const apisSinqiaHmg = {
    login: 'https://api-fundoparanahmg.sinqia.com.br/api/acesso/login',
    obterCobrancasEmAberto: 'https://api-fundoparanahmg.sinqia.com.br/api/v1/beneficio/adesao/obterCobrancasEmAberto/{{pCPF}}',
    obterListaAdesoes: 'https://api-fundoparanahmg.sinqia.com.br/api/v1/beneficio/adesao/{{pCPF}}',
    obterCobrancasEmAtraso: 'https://api-fundoparana.sinqia.com.br/api/v1/beneficio/adesao/obterCobrancasEmAtraso/{{pIdAdesao}}'    
}

exports.default = functions.runWith(runtimeOpts).database.ref('usuarios/{chave}/integracoes/sinqia/api/{apiSolicitada}/request').onWrite(
  async (change, context) => {

    if (!change.after.exists() || change.after.val()=='') {
        return
    }
    let chave = context.params.chave
    let apiSolicitada = context.params.apiSolicitada
    let dadosApiSolicitada = change.after.val()
    console.log('#buscaDadosSinqia - API solicitada:', apiSolicitada, ' - para chave:', chave)
    console.log('#buscaDadosSinqia - busca token de autenticação', dadosApiSolicitada)
    return recuperaTokenSinqia(dadosApiSolicitada.ambiente).then((accessToken) => {
        if (!accessToken) {
            console.error('#buscaDadosSinqia - erro ao recuperar token. Veja mensagens anteriores.')
            return false
        }
        return obterListaAdesoes(accessToken, chave, dadosApiSolicitada).then((pIdAdesao) => {
            if (pIdAdesao===null) {
                console.error('#buscaDadosSinqia - não foi possível identificar o ID da adesão do participante.')
                return false    
            }
            if (apiSolicitada==='obterCobrancasEmAberto') {
                return obterCobrancasEmAberto(accessToken, chave, dadosApiSolicitada)
            }
            if (apiSolicitada==='obterCobrancasEmAtraso') {
                return obterCobrancasEmAtraso(accessToken, chave, pIdAdesao)
            }
        })

    })

})

function getTokenSinqia(ambiente) {

    const bearer = 'Bearer mHNrKEXC_jiwX8CCUyEQQM55fvdJZMh4_4SoopdgMQwPKMIWN07gCt45zE4L4FmabQZ0qZtpfsgImdeTxP1BokSANPqvr1TZZYw99rrCI1vpjs_tT4YwUfGNSRzMeQnT9X_aT0ROvLGM9V_JotCytNRXg-fcQqQrs9XfnGpuCjokDxu1HUuzdVHpoKKoIvBs2SFbnzO_H4NqTtoMJsaIGIbcm0'

    const bodyLogin = JSON.stringify({
        Login: "admin",
        Password: "atena2011"
    });

    const headerLogin = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': bearer,
    };

    let url = ambiente==='PRD' ? apisSinqiaPrd.login : apisSinqiaHmg.login
    const options = {
        url: url,
        method: 'POST',
        headers: headerLogin,
        body: JSON.stringify(bodyLogin)
    }
    
    console.log('==> iniciando validação da API', options)
    return request(options).then((response) => {
        console.log('#buscaDadosSinqia - Token Sinqia gerado com sucesso.')
        return response
    }).catch((e) => {
        console.error('#buscaDadosSinqia - erro na requisição à API de login da Sinqia:',e)
        return false
    })
}

function recuperaTokenSinqia(ambiente) {
    let atualizaToken = false
    let ref = admin.database().ref('usuarios/shared/sinqia/accessToken')
    return ref.once('value').then((snapshot) => {
        let accessToken = snapshot.val()
        console.log('===> snapshot.val()', snapshot.val())
        let dataAgora = new Date()
        atualizaToken = !accessToken || accessToken.data_limite_request <= dataAgora
        if (atualizaToken) {
            return getTokenSinqia(ambiente)
        } else {
            return accessToken
        }
    }).then((accessToken) => {
        if (!accessToken) {
            return false
        } else if (atualizaToken) {
            //caso tenha gerado novo token, grava na base para compartilhar com outras requisições
            accessToken = JSON.parse(accessToken)
            let expiresIn = Number(accessToken.expiresIn)
            let dataLimite = new Date()
            dataLimite.setSeconds( dataLimite.getSeconds() + (expiresIn - 120) ) //deixa 2 minutos de margem    
            accessToken['data_limite_request'] = dataLimite
            console.log('===> accessToken', accessToken)
            ref = admin.database().ref('usuarios/shared/sinqia/accessToken')
            ref.update(accessToken)
        }

        return accessToken.accessToken
    }).catch((e) => {
        console.log('Erro na chamada da API Sinqia:', e)
        return false
    })

}

function obterCobrancasEmAberto(accessToken, chave, dadosRequest) {

    const bearer = 'Bearer '+accessToken

    const headerLogin = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': bearer,
    };

    if (!dadosRequest.ambiente || !dadosRequest.cpf) {
        console.log('#buscaDadosSinqia - obterCobrancasEmAberto - erro no formato da requisição à API - Ambiente:', dadosRequest.ambiente, ' - Cpf:', dadosRequest.cpf)
        return false
    }
    let url = dadosRequest.ambiente==='PRD' ? apisSinqiaPrd.obterCobrancasEmAberto : apisSinqiaHmg.obterCobrancasEmAberto
    url = url.replace('{{pCPF}}', dadosRequest.cpf)
    const options = {
        url: url,
        method: 'GET',
        headers: headerLogin
    }
    console.log('==> iniciando busca da API obterCobrancasEmAberto', options, dadosRequest, bearer)
    return request(options).then((response) => {
        console.log('#buscaDadosSinqia - obterCobrancasEmAberto - retorno com sucesso.')
        let ref = admin.database().ref(`usuarios/${chave}/integracoes/sinqia/api/obterCobrancasEmAberto/response`)
        ref.update(JSON.parse(response))
        return true
    }).catch((e) => {
        console.error('#buscaDadosSinqia - obterCobrancasEmAberto - erro na requisição à API:', e)
        return false
    })

}

function obterListaAdesoes(accessToken, chave, dadosRequest) {

    let refAdesao = admin.database().ref(`usuarios/${chave}/integracoes/sinqia/api/id_adesao`)

    return refAdesao.once('value').then((snapshot) => {
        if (snapshot.val()!==null) {
            return snapshot.val()
        } else {
            const bearer = 'Bearer '+accessToken
            const headerLogin = {
                'Cache-Control': 'no-cache',
                'Content-Type': 'application/json',
                'Authorization': bearer,
            };
        
            if (!dadosRequest.ambiente || !dadosRequest.cpf) {
                console.log('#buscaDadosSinqia - obterListaAdesoes - erro no formato da requisição à API - Ambiente:', dadosRequest.ambiente, ' - Cpf:', dadosRequest.cpf)
                return false
            }
            let url = dadosRequest.ambiente==='PRD' ? apisSinqiaPrd.obterListaAdesoes : apisSinqiaHmg.obterListaAdesoes
            url = url.replace('{{pCPF}}', dadosRequest.cpf)
            const options = {
                url: url,
                method: 'GET',
                headers: headerLogin
            }
            console.log('==> iniciando busca da API obterListaAdesoes', options, dadosRequest, bearer)
            return request(options).then((response) => {
                console.log('#buscaDadosSinqia - obterListaAdesoes - retorno com sucesso.')
                //salva retorno da API
                let ref = admin.database().ref(`usuarios/${chave}/integracoes/sinqia/api/obterListaAdesoes/response`)
                response = JSON.parse(response)
                ref.update(response)
                //verifica se existem mais de uma adesão e pega apenas aquela da matrícula
                let ret = null
                result.forEach((itemAdesao) => {
                    if (itemAdesao === dadosRequest.matricula) {
                        ret = itemAdesao.IdAdesao
                    }
                })

                if (ret!==null) { //salva o IdAdesao para reutilizar em novas chamadas
                    refAdesao.update(itemAdesao.IdAdesao)
                }

                return ret
            }).catch((e) => {
                console.error('#buscaDadosSinqia - obterListaAdesoes - erro na requisição à API:', e)
                return false
            })
        
        }
    })
}

function obterCobrancasEmAtraso(accessToken, chave, pIdAdesao) {

    const bearer = 'Bearer '+accessToken

    const headerLogin = {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'Authorization': bearer,
    };

    if (!dadosRequest.ambiente || !dadosRequest.cpf) {
        console.log('#buscaDadosSinqia - obterCobrancasEmAtraso - erro no formato da requisição à API - Ambiente:', dadosRequest.ambiente, ' - Cpf:', dadosRequest.cpf)
        return false
    }
    let url = dadosRequest.ambiente==='PRD' ? apisSinqiaPrd.obterCobrancasEmAtraso : apisSinqiaHmg.obterCobrancasEmAtraso
    url = url.replace('{{pCPF}}', dadosRequest.cpf)
    const options = {
        url: url,
        method: 'GET',
        headers: headerLogin
    }
    console.log('==> iniciando busca da API obterCobrancasEmAtraso', options, dadosRequest, bearer)
    return request(options).then((response) => {
        console.log('#buscaDadosSinqia - obterCobrancasEmAtraso - retorno com sucesso.')
        let ref = admin.database().ref(`usuarios/${chave}/integracoes/sinqia/api/obterCobrancasEmAtraso/response`)
        ref.update(JSON.parse(response))
        return true
    }).catch((e) => {
        console.error('#buscaDadosSinqia - obterCobrancasEmAtraso - erro na requisição à API:', e)
        return false
    })

}
