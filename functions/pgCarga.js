'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jsonDataSelects = require('./pgCarga.json'); //json com os selects do Postgre
const utils = require('./utilsFunctions')
const financeiro = require('./Financeiro')

try {
  admin.initializeApp();
} catch (e) {}

const pg = require('pg')
var types = require('pg').types
types.setTypeParser(1700, 'text', parseFloat);

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '2GB'
}

/*************************************************
***********
*********
******
CARGA!!!!!!!!!

Carregar Atualizar lista e-mail Valido, com todas as chaves vinculadas ao CPF ou e-mail cadastrado!!!
CRIAR DADOS CADASTRO DENTRO DE USUARIOS
CRIAR DEMAIS DADOS (CAMPOS DO POSTGRE!!!! MESMO QUE NÃO USE AGORA - EX: vlrCota)

*/

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_base_carga').onWrite(
  async (change, context) => {

  if (!change.after.exists() || change.after.val()=='') {
    return
  }

  let dataBase = change.after.val()
  let plano = context.params.plano

  // inclui parametro de data de competência nos Selects
  let select = jsonDataSelects.dadosPortal
  select = select.replace(/--data_base_carga--/g, dataBase)
  select = select.replace(/--nome_plano--/g, plano)
  //console.log('===> select', select)

  let usuarios = {}

  return buscaDadosPG(select)
  .then((retDadosPG) => {
    if (!retDadosPG) {
      console.log('#pgCarga - Processamento cancelado. Verifique mensagens anteriores.')
      return false
    }
    let chave = '', usr
    let listaItensContribuicaoChave = {}, listaValoresContribuicaoChave = {}, listaItensReservaChave = {}, listaValoresReservaChave = {}, usrReservaTotal = {}, usuarioTotalContr ={}, listaItensCoberturas = {}, listaDatasetsProjetoDeVida = {}, listaItensProjetoDeVidaProjecao = {}, listaItensProjetoDeVidaCoberturas = {},listaMesesProjetoDeVida = {}
    retDadosPG.forEach((rowDados) => {
      console.log('====> processando participante: ', rowDados.chave, ' - chave anterior:', chave)
      if (chave !== rowDados.chave) {
        if (chave !== '') {
          //Reserva Total - só na mudança da chave por que precisa do valor total da contribuição
          let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioTotalContr.valor, usr.nasc, usr.dataadesao, usr.taxa, 'completo')          
          let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioTotalContr.valor, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje')                    
          listaDatasetsProjetoDeVida[2] = {
            backgroundColor: "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
            borderColor: "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
            borderWidth: "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
            label: 'Reserva Total',
            data: retGraficoReservaCompleto[0]
          }
          listaDatasetsProjetoDeVida[3] = {
            backgroundColor: "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
            borderColor: "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
            borderWidth: "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
            label: 'Reserva Total',
            data: retGraficoReservaAteHoje[0]
          }          

          listaItensProjetoDeVidaProjecao[0] = {
            cor: '<<seg_projeto_vida.itens.projecao.0.cor>>',
            nome: 'Renda projetada',
            valor: 0
          }            
          listaItensProjetoDeVidaProjecao[1] = {
            cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
            nome: 'Reserva projetada',
            valor: listaDatasetsProjetoDeVida[2].data[5]
          }     

          listaMesesProjetoDeVida = retGraficoReservaCompleto[1]

          //salva informações acumuladas do usuário
          //let transacoes = usuariosAnterior && usuariosAnterior[chave] ? usuariosAnterior[chave] : ''
          usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida)
        }
        //carrega dados novo registro do usuário
        chave = rowDados.chave        
        usr =  {
          apelido: rowDados.cad_apelido,
          matricula: rowDados.cad_matricula,
          nome: rowDados.cad_nome,
          plano: rowDados.cad_plano,
          tipoPlano: rowDados.cad_tipo_plano,
          segmento: validaSegmento(chave),
          competencia: dataBase.substring(0,7),
          nasc: rowDados.cad_nasc,
          dataadesao: rowDados.cad_dataadesao,
          taxa: 5.000
        }
        
        //Bloco estrutura valores de contribuição
        listaItensContribuicaoChave = {}
        listaValoresContribuicaoChave = {}
        usuarioTotalContr =  {
          color: "<<seg_contribuicao.total.color>>",
          nome: "Contribuição total",
          valor: 0
        }      
        listaItensReservaChave = {}   
        listaValoresReservaChave = {} 
        listaItensCoberturas = {}
        listaDatasetsProjetoDeVida = {}
        listaItensProjetoDeVidaProjecao = {}
        listaItensProjetoDeVidaCoberturas = {}
        listaMesesProjetoDeVida = {}

        //Bloco estrutura valores de Reserva
        listaItensReservaChave[0] = {
          cor: '<<seg_saldo_reserva.itens.0.cor>>',
          nome: rowDados.res_nomesaldototal,
          valor: rowDados.res_saldototal
        }
        listaItensReservaChave[1] = {
          cor: '<<seg_saldo_reserva.itens.1.cor>>',
          nome: rowDados.res_nomesaldoparticipante,
          valor: rowDados.res_saldoparticipante
        }
        listaItensReservaChave[2] = {
          cor: '<<seg_saldo_reserva.itens.2.cor>>',
          nome: rowDados.res_nomesaldopj,
          valor: rowDados.res_saldopj
        }
        listaValoresReservaChave[0] = rowDados.res_saldoparticipante
        listaValoresReservaChave[1] = rowDados.res_saldopj
        usrReservaTotal = {
          color: '<<seg_saldo_reserva.total.color>>',
          nome: 'Reserva Total',
          valor: rowDados.res_saldototal
        }

        //Bloco estrutura valores cobertura risco/seguro
        //MOrte
        let capitalMorte = rowDados.cob_capitalmorte !== null ? rowDados.cob_capitalmorte : '(não contratado)'
        listaItensCoberturas[0] = {
          cor: '<<seg_coberturas.lista_itens_coberturas.0.cor>>',
          nome: rowDados.cob_nomecapitalmorte,
          valor: capitalMorte
        }
        //Invalidez
        let capitalInvalidez = rowDados.cob_capitalinvalidez !== null ? rowDados.cob_capitalinvalidez : '(não contratado)'
        listaItensCoberturas[1] = {
          cor: '<<seg_coberturas.lista_itens_coberturas.1.cor>>',
          nome: rowDados.cob_nomecapitalinvalidez,
          valor: capitalInvalidez
        }

        //Bloco estrutura valores projeto de vida
        //cobertura por morte
        if (capitalMorte !== '(não contratado)') {        
          listaDatasetsProjetoDeVida[0] = {
            backgroundColor: "<<seg_projeto_vida.grafico.datasets.0.backgroundColor>>",
            borderColor: "<<seg_projeto_vida.grafico.datasets.0.borderColor>>",
            borderWidth: "<<seg_projeto_vida.grafico.datasets.0.borderWidth>>",
            label: rowDados.cob_nomecapitalmorte,
            data: {
              0: capitalMorte,
              1: capitalMorte,
              2: capitalMorte,
              3: capitalMorte,
              4: capitalMorte,
              5: capitalMorte
            }
          }
          listaItensProjetoDeVidaCoberturas[0] = {
            cor: '<<seg_projeto_vida.itens.coberturas.0.cor>>',
            nome: rowDados.cob_nomecapitalmorte,
            valor: capitalMorte
          }
        }
        //cobertura por Invalidez
        if (capitalInvalidez !== '(não contratado)') {
          listaDatasetsProjetoDeVida[1] = {
            backgroundColor: "<<seg_projeto_vida.grafico.datasets.1.backgroundColor>>",
            borderColor: "<<seg_projeto_vida.grafico.datasets.1.borderColor>>",
            borderWidth: "<<seg_projeto_vida.grafico.datasets.1.borderWidth>>",
            label: rowDados.cob_nomecapitalinvalidez,
            data: {
              0: capitalInvalidez,
              1: capitalInvalidez,
              2: capitalInvalidez,
              3: capitalInvalidez,
              4: capitalInvalidez,
              5: capitalInvalidez
            }
          }
          listaItensProjetoDeVidaCoberturas[1] = {
            cor: '<<seg_projeto_vida.itens.coberturas.1.cor>>',
            nome: rowDados.cob_nomecapitalinvalidez,
            valor: capitalInvalidez
          }            
        }
      } 

      listaItensContribuicaoChave[rowDados.contr_eventocod] = {
        cor: `<<seg_contribuicao.itens.${rowDados.contr_eventocod}.cor>>`,
        nome: rowDados.contr_eventonome,
        valor: rowDados.contr_valor
      }

      listaValoresContribuicaoChave[rowDados.contr_eventocod] = rowDados.contr_valor

      usuarioTotalContr.valor += rowDados.contr_valor
    })

    console.log('===> saindo do For... - chave', chave)
    if (chave!=='') {
      console.log('===> entrei no if - listaDatasetsProjetoDeVida:', listaDatasetsProjetoDeVida)
      let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioTotalContr.valor, usr.nasc, usr.dataadesao, usr.taxa, 'completo')          
      let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioTotalContr.valor, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje')                    
      listaDatasetsProjetoDeVida[2] = {
        backgroundColor: "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
        borderColor: "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
        borderWidth: "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
        label: 'Reserva Total',
        data: retGraficoReservaCompleto[0]
      }
      listaDatasetsProjetoDeVida[3] = {
        backgroundColor: "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
        borderColor: "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
        borderWidth: "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
        label: 'Reserva Total',
        data: retGraficoReservaAteHoje[0]
      }          
      listaItensProjetoDeVidaProjecao[0] = {
        cor: '<<seg_projeto_vida.itens.projecao.0.cor>>',
        nome: 'Renda projetada',
        valor: 0
      }            
      listaItensProjetoDeVidaProjecao[1] = {
        cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
        nome: 'Reserva projetada',
        valor: listaDatasetsProjetoDeVida[2].data[5]
      }         
      
      listaMesesProjetoDeVida = retGraficoReservaCompleto[1]

      //salva informações acumuladas do usuário
      //let transacoes = usuariosAnterior && usuariosAnterior[chave] ? usuariosAnterior[chave] : ''
      usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida)
    }
    usuarios = insereRegistroTestes(usuarios)

    console.log('#pgCarga - finalizando carga - salvando usuários: ', usuarios)

    //salva dados anteriores dos usuários em usuariosHistorico
    let ref = admin.database().ref('usuarios')
    return ref.orderByChild('usr_plano').equalTo(plano).once('value')
    .then((usrAnterior) => {
      ref = admin.database().ref(`usuariosHistorico`)
      ref.remove()
      let dtHistorico = utils.dateFormat(new Date(), true, true)
      ref = admin.database().ref(`usuariosHistorico/${plano}`)
      let usrHistorico = {}
      usrHistorico[dtHistorico] = JSON.stringify(usrAnterior.val())
      return ref.update(usrHistorico) 
    //.then(() => {
    //  //salva informações finais/ATUAIS na chave de usuários
    //  ref = admin.database().ref('usuarios')
    //  return ref.remove() //apaga para garantir que somente participantes da base na competência terão valores disponiveis para o app
    }).then(() => {      
      console.log('===> usuarios string', JSON.stringify(usuarios))
      ref = admin.database().ref(`usuarios`)
      //ref.update({teste: JSON.stringify(usuarios)})
      return ref.update(usuarios)
    }).then(() => {
      console.log('#pgCarga - dados atualizados dos usuários foram salvos com sucesso.')
    }).catch((e) => {
      console.log('#pgCarga - erro ao final do processo. Dados não foram salvos.', e)
    })

  })


})

function incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida, transacoes) {

  /*usr_dados_cadastro: {

  },*/

  usuarios[chave] = {
    usr_competencia: usr.competencia,
    usr_apelido: usr.apelido,
    usr_matricula: usr.matricula,
    usr_nome: usr.nome,
    usr_plano: usr.plano,
    usr_tipo_plano: usr.tipoPlano,
    usr_dtnasc: usr.nasc,
    usr_segmento: validaSegmento(chave),
    usr_taxaPadrao: usr.taxa,
    usr_contribuicao: {
      acao: {
        valor_contribuicao_potencial: calculaContribuicaoPotencial(),
        valor_deducao_potencial: calculaDeducaoPotencial(),
        vigente: true
      },
      lista_itens_contribuicao: listaItensContribuicaoChave,
      lista_valores_contribuicao: listaValoresContribuicaoChave,
      total: usuarioTotalContr,
      vigente: true      
    },
    usr_saldo_reserva: {
      lista_itens_reserva: listaItensReservaChave,
      lista_valores_reserva: listaValoresReservaChave,
      total: usrReservaTotal,
      vigente: true      
    },
    usr_coberturas: {
      acao: {
        valor_cobertura_potencial: calculaCoberturaPotencial(),
        vigente: true
      },
      lista_itens_coberturas: listaItensCoberturas,
      vigente: true
    },
    usr_projeto_vida : {
      acao: {
        valor_renda_potencial: calculaRendaPotencial(),
        valor_reserva_potencial: calculaReservaPotencial(),
        vigente: true
      },
      lista_datasets_projetoDeVida: listaDatasetsProjetoDeVida,
      lista_itens_projetoDeVida: {
        coberturas: listaItensProjetoDeVidaCoberturas,
        projecao: listaItensProjetoDeVidaProjecao
      },
      lista_meses_projetoDeVida: listaMesesProjetoDeVida,
      vigente: true
    }
    //,    transacoes: transacoes ? transacoes : ''
  }

  return usuarios
}

function calculaGraficoReserva(valorHoje, contribHoje, dataNasc, dataAdesao, taxa, amplitude) {

  let retDataset = {
    0: 0    
  }
  let retListaMeses = {
    0: "Adesão"
  }

  //transforma taxa anual em mensal:
  taxa = (1+(taxa/100))^(1/12)

  //valorHoje = Number(valorHoje.replace('.','').replace(',','.'))

  //calculo da reserva aos 65 anos
  let dtNasc = new Date(dataNasc)
  let data65Anos = new Date((dtNasc.getFullYear() + 65).toString()+'-'+(dtNasc.getMonth()+1).toString()+'-'+dtNasc.getDate().toString())
  
  let difMesesHoje65Anos = utils.diffDatasEmMeses(new Date(), data65Anos)
  let difMesesDaAdesao65Anos = utils.diffDatasEmMeses(dataAdesao, data65Anos)
  let difMesesDaAdesaoHoje = utils.diffDatasEmMeses(dataAdesao, new Date())

  let valor65anos = financeiro.valorFuturo(valorHoje, taxa, difMesesHoje65Anos, contribHoje)
  
  //monta array de Idades (EIXO X DO GRÀFICO) de acordo com a Adesão e 65 anos
  let crescPorFaixas = difMesesDaAdesao65Anos / 5
  let aIdades = [
      1, 
      Math.trunc(1 + (crescPorFaixas)), 
      Math.trunc(1 + (crescPorFaixas * 2)), 
      Math.trunc(1 + (crescPorFaixas * 3)), 
      Math.trunc(1 + (crescPorFaixas * 4)), 
      difMesesDaAdesao65Anos
  ]

  let taxaCrescimentoRealReserva = financeiro.taxaCrescimentoRealReserva(valorHoje, difMesesDaAdesaoHoje, contribHoje)

  for (let linha in aIdades) {
    let dif = aIdades[linha] - difMesesDaAdesaoHoje    
    if (linha > 0) {
      if (dif < 0) { //calculo de valor presente - de hoje para trás..
        retDataset[linha] = financeiro.valorPresente(valorHoje, taxaCrescimentoRealReserva, (difMesesDaAdesaoHoje - aIdades[linha]))
        retListaMeses[linha] = ''        
      } else {
        if (dif <= crescPorFaixas) { //posiciona o valor do mês atual
          retListaMeses[linha] = 'Hoje'        
          retDataset[linha] = valorHoje  //posiciona o valor de hoje na faixa mais aproximada
          if (amplitude==='até hoje') {
            console.log('saindo do Break')
            break 
          }
        } else {
          retListaMeses[linha] = ''     
          retDataset[linha] = financeiro.valorFuturo(valorHoje, taxa, dif, contribHoje) //projeta até o mês da faixa
        }
      }  
    }
  }

  if (amplitude==='completo') {
    retListaMeses[5] = '65 anos'     
    retDataset[5] = valor65anos    //inclui valor projetado de 65 anos na última faixa
  }

  return [retDataset, retListaMeses]
}

function calculaContribuicaoPotencial() {
  return 1000
}

function calculaDeducaoPotencial() {
  return 300
}

function calculaRendaPotencial() {
  return 5000
}

function calculaReservaPotencial() {
  return '1,2 Mi'
}

function validaSegmento() {
  return 'blue'
}

function calculaCoberturaPotencial() {
  return '1,1 Mi'
}

async function getConnection () {
  const pgConfig = {
    max: 1,
    user: "postgres",
    password: "maisFuturo90()12!@",
    database: "Sinqia",
    host: "/cloudsql/portal-mais-futuro:southamerica-east1:maisfuturobd"
  };
  return new pg.Pool(pgConfig);
}

async function buscaDadosPG(select) {
  console.log('======> 1. iniciando buscaDadosPG - select:', select)

  return getConnection().then( async (pgConn) => {
    console.log('=====> Conectei no PG')
    let result = await pgConn.query(select)
    console.log('=====> Query rodou')
    let ret
    if (!result) {
      console.log('#pgCarga - buscaDadosPG - retorno da query vazio.')
      ret = false
    } else {
      console.log('=====> result buscaDadosPG', result)  
      ret = result.rows 
    }
    pgConn.end()
    return ret
  }).catch(e => {
    console.log('#pgCarga - buscaDadosPG - Erro na conexão ao PG:',e);
    return false
  })
}

function insereRegistroTestes(usuarios){
  usuarios['9999-0001'] = 
  {
    "usr_tipo_plano" : 'instituido',
    "usr_apelido" : "Leandro",
    "usr_plano" : "Mais Futuro",
    "usr_dtnasc" : '10/03/1978',
    "usr_taxaPadrao" : 5.0000,
    "usr_campanhas" : {
      "aporte" : {
        "ativo" : true,
        "valor_aporte_potencial" : "0,5%"
      },
      "emprestimos" : {
        "ativo" : true,
        "valor_emprestimo_potencial" : "8.500,00"
      },
      "vigente" : true
    },
    "usr_coberturas" : {
      "acao" : {
        "valor_cobertura_potencial" : "1 Mi"
      },
      "lista_itens_coberturas" : [ {
        "cor" : "<<seg_coberturas.lista_itens_coberturas.0.cor>>",
        "nome" : "Cobertura por morte",
        "valor" : "R$ 281.690,10"
      }, {
        "cor" : "<<seg_coberturas.lista_itens_coberturas.1.cor>>",
        "nome" : "Cobertura por invalidez",
        "valor" : "R$ 402.415,26"
      } ],
      "vigente" : true
    },
    "usr_contribuicao" : {
      "acao" : {
        "valor_contribuicao_potencial" : "25,00",
        "valor_deducao_potencial" : "400,00"
      },
      "lista_itens_contribuicao" : [ {
        "cor" : "<<seg_contribuicao.itens.0.cor>>",
        "nome" : "maisfuturo previdência",
        "valor" : "178,70"
      }, {
        "cor" : "<<seg_contribuicao.itens.1.cor>>",
        "nome" : "Cobertura | morte",
        "valor" : "40,96"
      }, {
        "cor" : "<<seg_contribuicao.itens.2.cor>>",
        "nome" : "Cobertura | invalidez",
        "valor" : "47,56"
      }, {
        "cor" : "<<seg_contribuicao.itens.3.cor>>",
        "nome" : "maisfuturo reserva",
        "valor" : "32,76"
      } ],
      "lista_valores_contribuicao" : [ 178.7, 40.96, 47.56, 32.78 ],
      "total" : {
        "color" : "<<seg_contribuicao.total.color>>",
        "nome" : "Contribuição total",
        "valor" : "300,00"
      },
      "vigente" : true
    },
    "usr_matricula" : "0001",
    "usr_nome" : "LEANDRO ROCHA FURINI",
    "usr_projeto_vida" : {
      "acao" : {
        "valor_renda_potencial" : "3.000,00",
        "valor_reserva_potencial" : "1 mi"
      },
      "lista_datasets_projetoDeVida" : [ {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.0.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.0.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.0.borderWidth>>",
        "data" : [ 281690.1, 281690.1, 281690.1, 281690.1, 281690.1, 281690.1 ],
        "label" : "Cobertura por morte",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.0.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.1.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.1.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.1.borderWidth>>",
        "data" : [ 402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26 ],
        "label" : "Cobertura por invalidez",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.1.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
        "data" : [ 0, 20000.45, 52780.9, 112500.45, 200000.32, 405321.56 ],
        "label" : "Reserva",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.2.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
        "data" : [ 0, 20000.45, 52780.9, 112500.45 ],
        "label" : "Reserva",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.3.lineTension>>",
        "pointRadius" : "0"
      } ],
      "lista_itens_projetoDeVida" : {
        "coberturas" : [ {
          "cor" : "<<seg_projeto_vida.itens.coberturas.0.cor>>",
          "nome" : "Cobertura por Invalidez",
          "valor" : "R$ 402.415,26"
        }, {
          "cor" : "<<seg_projeto_vida.itens.coberturas.1.cor>>",
          "nome" : "Cobertura por Morte",
          "valor" : "R$ 281.690,10"
        } ],
        "projecao" : [ {
          "cor" : "<<seg_projeto_vida.itens.projecao.0.cor>>",
          "nome" : "Renda projetada",
          "valor" : "R$ 2.158,54"
        }, {
          "cor" : "<<seg_projeto_vida.itens.projecao.1.cor>>",
          "nome" : "Reserva projetada",
          "valor" : "R$ 450.321,56"
        } ]
      },
      "lista_meses_projetoDeVida" : [ "Jan", "Fev", "Mar", "Hoje", "Mai", "65 anos" ],
      "vigente" : true
    },
    "usr_saldo_reserva" : {
      "lista_cores_reserva" : [ "#8ACE7B", "#1779C6", "#ffd700", "#ee7600", "#6f4377" ],
      "lista_itens_reserva" : [ {
        "cor" : 1,
        "nome" : "Total",
        "valor" : "34.628,10"
      }, {
        "cor" : "<<seg_saldo_reserva.itens.1.cor>>",
        "nome" : "Funcional",
        "valor" : "28.523,30"
      }, {
        "cor" : "<<seg_saldo_reserva.itens.2.cor>>",
        "nome" : "Patronal",
        "valor" : "6.104,80"
      } ],
      "lista_valores_reserva" : [ 28523.2, 6104.8 ],
      "total" : {
        "color" : "#003366",
        "nome" : "Reserva total anual",
        "valor" : "34.628,10"
      },
      "vigente" : true
    },
    "segmento" : "black"
  }
  usuarios['9999-0002'] = 
  {
    "usr_tipo_plano" : 'instituido',
    "usr_apelido" : "Juliano",
    "usr_plano" : "Mais Futuro",
    "usr_dtnasc" : '10/03/1978',  
    "usr_taxaPadrao" : 5.0000,  
    "usr_campanhas" : {
      "aporte" : {
        "ativo" : true,
        "valor_aporte_potencial" : "0,5%"
      },
      "emprestimos" : {
        "ativo" : true,
        "valor_emprestimo_potencial" : "8.500,00"
      },
      "vigente" : true
    },
    "usr_coberturas" : {
      "acao" : {
        "valor_cobertura_potencial" : "1 Mi"
      },
      "lista_itens_coberturas" : [ {
        "cor" : "<<seg_coberturas.lista_itens_coberturas.0.cor>>",
        "nome" : "Cobertura por morte",
        "valor" : "R$ 281.690,10"
      }, {
        "cor" : "<<seg_coberturas.lista_itens_coberturas.1.cor>>",
        "nome" : "Cobertura por invalidez",
        "valor" : "R$ 402.415,26"
      } ],
      "vigente" : true
    },
    "usr_contribuicao" : {
      "acao" : {
        "valor_contribuicao_potencial" : "25,00",
        "valor_deducao_potencial" : "400,00"
      },
      "lista_itens_contribuicao" : [ {
        "cor" : "<<seg_contribuicao.itens.0.cor>>",
        "nome" : "maisfuturo previdência",
        "valor" : "178,70"
      }, {
        "cor" : "<<seg_contribuicao.itens.1.cor>>",
        "nome" : "Cobertura | morte",
        "valor" : "40,96"
      }, {
        "cor" : "<<seg_contribuicao.itens.2.cor>>",
        "nome" : "Cobertura | invalidez",
        "valor" : "47,56"
      }, {
        "cor" : "<<seg_contribuicao.itens.3.cor>>",
        "nome" : "maisfuturo reserva",
        "valor" : "32,76"
      } ],
      "lista_valores_contribuicao" : [ 178.7, 40.96, 47.56, 32.78 ],
      "total" : {
        "color" : "<<seg_contribuicao.total.color>>",
        "nome" : "Contribuição total",
        "valor" : "300,00"
      },
      "vigente" : true
    },
    "usr_matricula" : "0001",
    "usr_nome" : "JULIANO RIBEIRO KOSNY",
    "usr_projeto_vida" : {
      "acao" : {
        "valor_renda_potencial" : "3.000,00",
        "valor_reserva_potencial" : "1 mi"
      },
      "lista_datasets_projetoDeVida" : [ {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.0.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.0.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.0.borderWidth>>",
        "data" : [ 281690.1, 281690.1, 281690.1, 281690.1, 281690.1, 281690.1 ],
        "label" : "Cobertura por morte",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.0.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.1.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.1.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.1.borderWidth>>",
        "data" : [ 402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26 ],
        "label" : "Cobertura por invalidez",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.1.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
        "data" : [ 0, 20000.45, 52780.9, 112500.45, 200000.32, 405321.56 ],
        "label" : "Reserva",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.2.lineTension>>",
        "pointRadius" : "0"
      }, {
        "backgroundColor" : "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
        "borderColor" : "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
        "borderWidth" : "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
        "data" : [ 0, 20000.45, 52780.9, 112500.45 ],
        "label" : "Reserva",
        "lineTension" : "<<seg_projeto_vida.grafico.datasets.3.lineTension>>",
        "pointRadius" : "0"
      } ],
      "lista_itens_projetoDeVida" : {
        "coberturas" : [ {
          "cor" : "<<seg_projeto_vida.itens.coberturas.0.cor>>",
          "nome" : "Cobertura por Invalidez",
          "valor" : "R$ 402.415,26"
        }, {
          "cor" : "<<seg_projeto_vida.itens.coberturas.1.cor>>",
          "nome" : "Cobertura por Morte",
          "valor" : "R$ 281.690,10"
        } ],
        "projecao" : [ {
          "cor" : "<<seg_projeto_vida.itens.projecao.0.cor>>",
          "nome" : "Renda projetada",
          "valor" : "R$ 2.158,54"
        }, {
          "cor" : "<<seg_projeto_vida.itens.projecao.1.cor>>",
          "nome" : "Reserva projetada",
          "valor" : "R$ 450.321,56"
        } ]
      },
      "lista_meses_projetoDeVida" : [ "Jan", "Fev", "Mar", "Hoje", "Mai", "65 anos" ],
      "vigente" : true
    },
    "usr_saldo_reserva" : {
      "lista_cores_reserva" : [ "#8ACE7B", "#1779C6", "#ffd700", "#ee7600", "#6f4377" ],
      "lista_itens_reserva" : [ {
        "cor" : 1,
        "nome" : "Total",
        "valor" : "34.628,10"
      }, {
        "cor" : "<<seg_saldo_reserva.itens.1.cor>>",
        "nome" : "Funcional",
        "valor" : "28.523,30"
      }, {
        "cor" : "<<seg_saldo_reserva.itens.2.cor>>",
        "nome" : "Patronal",
        "valor" : "6.104,80"
      } ],
      "lista_valores_reserva" : [ 28523.2, 6104.8 ],
      "total" : {
        "color" : "#003366",
        "nome" : "Reserva total anual",
        "valor" : "34.628,10"
      },
      "vigente" : true
    },
    "segmento" : "black"
  }
  return usuarios
}



