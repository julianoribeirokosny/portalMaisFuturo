'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const jsonDataSelects = require('./pgCarga.json'); //json com os selects do Postgre

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

*/

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_base_carga').onWrite(
  async (change, context) => {

  console.log('====> change.after', change.after.val())
  if (!change.after.exists() || change.after.val()=='') {
    return
  }

  let dataBase = change.after.val()
  let plano = context.params.plano

  // inclui parametro de data de competência nos Selects
  let select = jsonDataSelects['dados_portal']
  select = select.replace(/--data_base_carga--/g, dataBase)
  select = select.replace(/--nome_plano--/g, plano)
  console.log('===> select', select)

  let usuarios = {}
  return buscaDadosPG(select)
  .then((retDadosPG) => {
    console.log('======> retDadosPG', retDadosPG)
    if (!retDadosPG) {
      console.log('#pgCarga - Processamento cancelado. Verifique mensagens anteriores.')
      return false
    }
    let chave = '', usr
    let listaItensContribuicaoChave = {}, listaValoresContribuicaoChave = {}, listaItensReservaChave = {}, listaValoresReservaChave = {}, usrReservaTotal = {}
    let usuarioTotalContr = 0
    retDadosPG.forEach((rowDados) => {
      console.log('======> rowDados', rowDados)
      if (chave !== rowDados.chave) {
        if (chave !== '') {
          //salva informações acumuladas do usuário
          usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, listaItensReservaChave, usuarioTotalContr, usrReservaTotal)
        }
        //carrega dados novo registro do usuário
        chave = rowDados.chave        
        console.log('======> chave', chave)
        usr =  {
          apelido: rowDados.cad_apelido,
          matricula: rowDados.cad_matricula,
          nome: rowDados.cad_nome,
          plano: rowDados.cad_plano,
          segmento: validaSegmento(chave),
          competencia: dataBase.substring(0,6)
        }
        listaItensContribuicaoChave = {}
        listaValoresContribuicaoChave = {}
        listaItensReservaChave = {}
        listaValoresReservaChave = {}
        usrReservaTotal = {}
        usuarioTotalContr = 0
      } 
      console.log('====> lendo dados do participante:'+chave, usr)

      listaItensContribuicaoChave[rowDados.contr_eventocod] = {
        cor: `<<seg_contribuicao.itens.${rowDados.contr_eventocod}.cor>>`,
        nome: rowDados.contr_eventonome,
        valor: rowDados.contr_valor
      }

      listaValoresContribuicaoChave[rowDados.contr_eventocod] = rowDados.contr_valor

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
        nome: 'Saldo Total',
        valor: rowDados.res_saldototal
      }

      usuarioTotalContr += rowDados.contr_valor
    })

    if (chave!=='') {
      usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, listaItensReservaChave, listaValoresReservaChave, usuarioTotalContr, usrReservaTotal)
    }
    usuarios = insereRegistroTestes(usuarios)
    console.log('usuarios', usuarios)

    //salva dados anteriores dos usuários em usuariosHistorico
    let ref = admin.database().ref('usuarios')
    return ref.once('value').then((usuariosAnterior) => {
      ref = admin.database().ref(`usuariosHistorico/${dataBase}`)
      return ref.update(usuariosAnterior)
    }).then(() => {
      //salva informações finais/ATUAIS na chave de usuários
      ref = admin.database().ref('usuarios')
      return ref.update(usuarios)
    }).then(() => {
      console.log('#pgCarga - dados atualizados dos usuários foram salvos com sucesso.')
    }).catch((e) => {
      console.log('#pgCarga - erro ao final do processo. Dados não foram salvos.', e)
    })


  })


})

function incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, listaItensReservaChave, usuarioTotalContr) {

  /*usr_dados_cadastro: {

  },*/

  usuarios[chave] = {
    usr_competencia: usr.competencia,
    usr_apelido: usr.apelido,
    usr_matricula: usr.matricula,
    usr_nome: usr.nome,
    usr_plano: usr.plano,
    usr_segmento: validaSegmento(chave),
    usr_contribuicao: {
      acao: {
        valor_contribuicao_potencial: calculaContribuicaoPotencial(),
        valor_deducao_potencial: calculaDeducaoPotencial()
      },
      lista_itens_contribuicao: listaItensContribuicaoChave,
      lista_valores_contribuicao: listaValoresContribuicaoChave,
      total: {
        color: "<<seg_contribuicao.total.color>>",
        nome: "Contribuição total",
        valor: usuarioTotalContr
      }  
    },
    usr_saldo_reserva: {
      lista_itens_reserva: listaItensReservaChave

    }
  }

  return usuarios
}

function calculaContribuicaoPotencial() {
  return 1000
}

function calculaDeducaoPotencial() {
  return 300
}

function validaSegmento() {
  return 'blue'
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
  console.log('======> 1. iniciando buscaDadosPG')

  return getConnection().then( async (pgConn) => {
    let result = await pgConn.query(select)
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
    "usr_apelido" : "Leandro",
    "usr_plano" : "Mais Futuro",
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
    "usr_apelido" : "Juliano",
    "usr_plano" : "Mais Futuro",
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



