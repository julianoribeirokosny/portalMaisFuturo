'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const previdenciaDigital = require('./previdenciaDigital.js')
const pipefy = require('./pipefy.js')

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
    timeoutSeconds: 60,
    memory: '1GB'
}
  
exports.default = functions.runWith(runtimeOpts).pubsub.schedule('every 12 hours')
  .timeZone('America/Sao_Paulo')
  .onRun((context) => {
    console.log('#scheduleStatusBoleto - iniciando processamento.');
    let data = {
        body: {
            status: {
                pago: true,
                cancelado: true,
                baixaManual: true,
                aguardandoPagamento: false                        
            }    
        },
        idApi: 'listarcobrancas',
        metodo: 'POST'
    }

    let boletos
    return previdenciaDigital.run(data, functions, admin).then((retorno) => {
        console.log('=====> retorno', retorno)
        console.log('=====> retorno.sucesso', retorno.sucesso)
        let response = JSON.parse(retorno.response)
        console.log('=====> response.length', response.length)        
        if (!retorno.sucesso || response.length < 1) {
            console.error('#scheduleStatusBoleto - Erro no retorno da previdenciaDigital. Nenhum boleto foi retornado pela API')
            return null
        }
        boletos = response.response
        console.log('===> boletos', boletos)
        let ref = admin.database().ref('usuarios')
        return ref.once('value')
    }).then((snapUsuarios)=> {
        snapUsuarios.forEach((snapUsr) => {
            if (snapUsr.key === '1-686') {
                console.log('===> iniciando 1-686')
                let usr = snapUsr.val()
                console.log('===> usr', usr)
                let chave = snapUsr.key
                console.log('===> chave', chave)
                let listaContribuicoes = usr.data.valores.historicoContribuicao
                let matricula = usr.data.cadastro.dados_plano.matricula
                let plano = usr.data.cadastro.dados_plano.plano
                console.log('===> listaContribuicoes', listaContribuicoes)
                if (usr) {
                    let naoPagos = []
                    listaContribuicoes.forEach((contrib, index) => {
                        if (!contrib.pago) {
                            naoPagos.push(index)
                        }
                    })
                    console.log('===> naoPagos', naoPagos)
                    naoPagos.forEach((item) => {
                        let boleto = boletos.filter((bol) => {
                            return bol.dataBase === listaContribuicoes[item].anoMes && 
                                bol.valor === listaContribuicoes[item].valor
                        })    
                        console.log('===> boleto', boleto)
                        boleto = boleto.sort((a,b) => {
                            return Number(b.codJuno) - Number(a.codJuno)
                        })
                        console.log('===> boleto reorder', boleto)
                        if (boleto.length > 0) {
                            let ultimoBoletoVigente = boleto[0] //pega somente o último é o que vale.. os outros estarão cancelados
                            console.log('===> ultimoBoletoVigente', ultimoBoletoVigente)
                            if (ultimoBoletoVigente.status==="PAGO" || ultimoBoletoVigente.status==="BAIXA MANUAL") {
                                console.log('===> baixando pgto')
                                let dadosCard = {
                                    tipoSolicitacao: 'Segunda-via de Boletos',
                                    chave: chave,
                                    dadosAnteriores: '(none)',
                                    dadosNovos: `Boleto Pago via Juno - valor: R$ ${ultimoBoletoVigente.valor} - codJuno: ${ultimoBoletoVigente.codJuno}`,
                                    matricula: matricula,
                                    plano: plano
                                }
                                let data = {acao: 'criarCard', body: dadosCard}
                                pipefy.run(data, functions, admin).then(() => { //cria um card no pipefy
                                    // se sucesso na criação do card, baixa pagamento da base... (pago: true)
                                    let refAux = admin.database().ref(`usuarios/${chave}/data/valores/historicoContribuicao/${item}`)
                                    console.log('====> refAux:', `usuarios/${chave}/data/valores/historicoContribuicao/${item}`)                                
                                    refAux.update({pago: true})    
                                })
                            } else { //cancelado!
                                console.log('===> cancelando')
                                let refAux = admin.database().ref(`usuarios/${chave}/transacoes/boleto/${listaContribuicoes[naoPagos].anoMes.replace('/','')}`)
                                refAux.once('value').then((snapshot) => {
                                    console.log('========> snapshot.val()', snapshot.val())
                                    if (snapshot.val() && snapshot.val().codJuno === ultimoBoletoVigente.codJuno) {
                                        refAux.update({})
                                    }
                                })
                            }
                        }
                  
                    })
                }
    
            }
        })
    }).catch((error) => {
        console.error('#scheduleStatusBoleto - Erro geral no processo.', error)
        return false
    })
});

