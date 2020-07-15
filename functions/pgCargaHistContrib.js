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

var logProcessamento = {}
var dataProcessamento
var dataBase, anoMes

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_carga_hist_contrib').onWrite(
  async (change, context) => {

  console.log('#pgCargaHistContrib - iniciando.')

  if (!change.after.exists() || change.after.val()=='') {
    return
  }

  dataBase = change.after.val()
  anoMes = dataBase.substring(5, 7) + '/' + dataBase.substring(0, 4)
  let plano = context.params.plano

  let select = jsonDataSelects.historicoContrib
  dataProcessamento = utils.dateFormat(new Date(), true, false)
  logProcessamento[dataProcessamento] = {
    tipo: 'Histórico de Contribuições',
    plano: plano,
    inicio: dataProcessamento.substring(-8),
    fim: '',
    qtd_participantes_carregados: 0,
    qtd_participantes_bloqueados: 0,
    status: 'Em andamento',
    msg: '',
    erro: '',
  }

  let usuarios = {} //lista de usuários que serão atualizados na base
  let usrAnterior
  let ref = change.after.ref.parent;

  return ref.once('value').then((snapshotParent)  => {
    if (!snapshotParent.val()) {
      console.error('#pgCarga - Processamento cancelado. Estrutura do settings do plano inconsistente.')
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Cancelado'
      logProcessamento[dataProcessamento].msg = 'Processamento cancelado. Estrutura do settings do plano inconsistente'
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)
      return false
    }
    console.log('===> verificando se há chaves específicas para a carga.')
    if (snapshotParent.hasChild('lista_chaves_carga')) {
      select = jsonDataSelects.historicoContribLista
      select = select.replace(/--lista_dados_carga--/g, snapshotParent.child('lista_chaves_carga').val())
    } else {
      select = jsonDataSelects.historicoContrib
    }
    select = select.replace(/--nome_plano--/g, plano)
    console.log('===> select', select)        

    ref = admin.database().ref('usuarios')
    return ref.orderByChild('home/usr_plano').equalTo(plano).once('value')
  }).then((usuariosAnterior) => {
    //salva dados anteriores de usuários
    usrAnterior = usuariosAnterior.val()
    usuarios = usrAnterior ? usrAnterior : {}
    return buscaDadosPG(select)  //select na base do Postgre
  }).then((retDadosPG) => {
    if (!retDadosPG) {
      console.error('#pgCargaHistContrib - Processamento cancelado. Verifique mensagens anteriores.')
      return false
    }

    retDadosPG.forEach((rowDados) => {
      if (usuarios[rowDados.chave] !== undefined && usuarios[rowDados.chave].data !== undefined) {
        usuarios[rowDados.chave].data.valores.historicoContribuicao = rowDados.jsonhistcontrib
      }
    })
    
    console.log('#pgCargaHistContrib - finalizando carga - salvando usuários: ', JSON.stringify(usuarios))
    ref = admin.database().ref(`usuarios`)
    return ref.update(usuarios)
    .then(() => {
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com sucesso'
      logProcessamento[dataProcessamento].qtd_participantes_carregados = Object.keys(usuarios).length
      logProcessamento[dataProcessamento].msg = 'Processamento finalizado com sucesso.'
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          
      console.log('#pgCargaHistContrib - dados atualizados dos usuários foram salvos com sucesso.')
      return true
    }).catch((e) => {
      console.error('#pgCargaHistContrib - erro ao final do processo. Dados não foram salvos.', e)
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com erro'
      logProcessamento[dataProcessamento].msg = 'Erro ao final do processo. Dados não foram salvos.'
      logProcessamento[dataProcessamento].erro = JSON.stringify(e)
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          
      return false
    })

  })


})

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
  console.log('#buscaDadosPG - Iniciando - select:', select)

  return getConnection().then( async (pgConn) => {
    //console.log('#buscaDadosPG - Banco conectado.')
    let result = await pgConn.query(select)
    let ret
    if (!result) {
      console.error('#pgCargaHistContrib - buscaDadosPG - retorno da query vazio.')
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com erro'
      logProcessamento[dataProcessamento].msg = 'O banco de dados não retornou nenhum registro'
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          
      ret = false
    } else {
      ret = result.rows 
    }
    pgConn.end()
    return ret
  }).catch(e => {
    console.error('#pgCargaHistContrib - buscaDadosPG - Erro na conexão ao PG:',e);
    logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
    logProcessamento[dataProcessamento].status = 'Finalizado com erro'
    logProcessamento[dataProcessamento].msg = 'Erro na conexão ao banco de dados.'
    logProcessamento[dataProcessamento].erro = e
    let refProc = admin.database().ref(`admin/carga/logProcessamento`)
    refProc.update(logProcessamento)          
    return false
  })
}
