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

/*************************************************
***********
*********
******
CARGA!!!!!!!!!

CRIAR DADOS CADASTRO DENTRO DE USUARIOS
CRIAR DEMAIS DADOS (CAMPOS DO POSTGRE!!!! MESMO QUE NÃO USE AGORA - EX: vlrCota)


*/

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_base_carga').onWrite(
  async (change, context) => {

  console.log('#pgCarga - iniciando.')

  if (!change.after.exists() || change.after.val()=='') {
    return
  }

  dataBase = change.after.val()
  anoMes = dataBase.substring(5, 6) + '-' + dataBase.substring(0, 3)
  let plano = context.params.plano

  // inclui parametro de data de competência nos Selects
  let select = jsonDataSelects.dadosPortal
  select = select.replace(/--data_base_carga--/g, dataBase)
  select = select.replace(/--nome_plano--/g, plano)
  console.log('===> select', select)

  dataProcessamento = utils.dateFormat(new Date(), true, false)
  logProcessamento[dataProcessamento] = {
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
  let usuariosBloquear = {} //lista de usuários que não foram carregados
  let usrAnterior
  //listas de parametros de cod contribuição 
  let listaContribSaldo, listaContribSaldo13, listaContribSaldoPartPlanoPatroc, listaContribSeguro, listaContribSaida, listaContribPortabilidade, listaContribExtraordinaria, listaContribSaldoPartEmpresa
  let listaSituacoesValidas //lista de situações de plano válidas para carga no portal

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
    } else {
      listaContribSaldo = snapshotParent.child('listaContribSaldo').val()
      listaContribSaldoPartEmpresa = snapshotParent.child('listaContribSaldoPartEmpresa').val()
      listaContribSaldo13 = snapshotParent.child('listaContribSaldo13').val()
      listaContribSaldoPartPlanoPatroc = snapshotParent.child('listaContribSaldoPartPlanoPatroc').val()
      listaContribSeguro = snapshotParent.child('listaContribSeguro').val()
      listaContribSaida = snapshotParent.child('listaContribSaida').val()
      listaContribPortabilidade = snapshotParent.child('listaContribSaida').val()
      listaContribExtraordinaria = snapshotParent.child('listaContribExtraordinaria').val()
      listaSituacoesValidas = snapshotParent.child('listaSituacoesValidas').val()
      //console.log('***> listaContribSaldo', listaContribSaldo)
      //console.log('***> listaContribSaldo13', listaContribSaldo13)
      //console.log('***> listaContribSaldoPartPlanoPatroc', listaContribSaldoPartPlanoPatroc)
      if (
        listaContribSaldo === null ||
        listaContribSaldo13 === null ||
        listaContribSaldoPartEmpresa === null ||
        listaContribSaldoPartPlanoPatroc === null ||
        listaContribSeguro === null ||
        listaContribSaida === null ||
        listaContribPortabilidade === null ||
        listaContribExtraordinaria === null ||
        listaSituacoesValidas === null 
        ) {
          console.error('#pgCarga - Processamento cancelado. Estrutura do settings do plano->contribuicao inconsistente.')
          logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
          logProcessamento[dataProcessamento].status = 'Cancelado'
          logProcessamento[dataProcessamento].msg = 'Processamento cancelado. Estrutura do settings do plano->contribuicao inconsistente.'
          let refProc = admin.database().ref(`admin/carga/logProcessamento`)
          refProc.update(logProcessamento)          
          return false   
      }
      //transforma em array
      listaContribSaldo = listaContribSaldo.split(';')
      listaContribSaldoPartEmpresa = listaContribSaldoPartEmpresa.split(';')
      listaContribSaldo13 = listaContribSaldo13.split(';')
      listaContribSaldoPartPlanoPatroc = listaContribSaldoPartPlanoPatroc.split(';')
      listaContribSeguro = listaContribSeguro.split(';')
      listaContribSaida = listaContribSaida.split(';')
      listaContribPortabilidade = listaContribPortabilidade.split(';')
      listaContribExtraordinaria = listaContribExtraordinaria.split(';')
      listaSituacoesValidas = listaSituacoesValidas.split(';')

    }
    ref = admin.database().ref('usuarios')
    return ref.orderByChild('home/usr_plano').equalTo(plano).once('value')

  }).then((usuariosAnterior) => {
    //salva dados anteriores de usuários
    usrAnterior = usuariosAnterior.val()
    usuarios = usrAnterior ? usrAnterior : {}
    return buscaDadosPG(select)  //select na base do Postgre
  }).then((retDadosPG) => {
    if (!retDadosPG) {
      console.error('#pgCarga - Processamento cancelado. Verifique mensagens anteriores.')
      return false
    }
    let chave = '', usr
    let listaItensContribuicaoChave = [], listaValoresContribuicaoChave = [], listaItensReservaChave = {}, listaValoresReservaChave = {}, usrReservaTotal = {}, usuarioTotalContr ={}, listaItensCoberturas = {}, listaDatasetsProjetoDeVida = {}, listaItensProjetoDeVidaProjecao = {}, listaItensProjetoDeVidaCoberturas = {},listaMesesProjetoDeVida = {}
    let usuarioContrib = {
      contribParticipante: 0,
      contribParticipantePlanoPatrocinado: 0,
      contribEmpresa: 0,
      contribRisco: 0
    }
    console.log('#pgCarga - iniciando forEach', retDadosPG)
    retDadosPG.forEach((rowDados) => {
      //primeiro verifica se está em situação do plano válida para o portal:
      //se não achou situação OK ou se saldoTotal is null, marca para bloquear
      let naoAchouSituacaoPlano = listaSituacoesValidas.indexOf(rowDados.cad_sitpart)<0
      if ( naoAchouSituacaoPlano || rowDados.res_saldototal === null) { 
        usuariosBloquear[`${rowDados.chave}/home`] = {
          usr_apelido: rowDados.cad_apelido,
          usr_matricula: rowDados.cad_matricula,
          usr_nome: rowDados.cad_nome,
          usr_plano: rowDados.cad_plano,
          usr_tipoPlano: rowDados.cad_tipo_plano,
          segmento: validaSegmento(chave),
          usr_competencia: dataBase.substring(0,7),
          usr_dtnasc: utils.dateFormat(rowDados.cad_nasc, false, false),
          usr_dtadesao: rowDados.cad_dataadesao,
          usr_vigente: false,
          motivo_bloqueio_carga: naoAchouSituacaoPlano ? 'situação não permitida para carga' : 'sem saldo total',
          usr_situacao_plano: rowDados.cad_sitpart
        }
        //console.log('====> Bloqueando participante: ', rowDados.chave, rowDados.cad_sitpart)
      } else {
        if (chave !== rowDados.chave) {
          if (chave !== '' && (usuarioContrib.contribParticipante+usuarioContrib.contribParticipantePlanoPatrocinado) > 0) {
            let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'completo', usr.idade, usr.tipoPlano)          
            let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje', usr.idade, usr.tipoPlano)                    
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
              valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[3],2)
            }            
            listaItensProjetoDeVidaProjecao[1] = {
              cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
              nome: 'Reserva projetada',
              valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[2],2)
            }     
  
            listaMesesProjetoDeVida = retGraficoReservaCompleto[1]
  
            //salva informações acumuladas do usuário
            usuarios = incluiUsuarioCadastroJSON (usuarios, chave, usr)
            usuarios = incluiUsuarioValoresJSON (usuarios, chave, usuarioContrib, usrReservaTotal.valor, Number(retGraficoReservaCompleto[2]), Number(retGraficoReservaCompleto[3]), usuarioTotalContr.valor)
            usuarios = incluiUsuarioHistContribJSON(usuarios, chave, usuarioContrib, anoMes)            
            usuarioTotalContr.valor = financeiro.valor_to_string_formatado(usuarioTotalContr.valor, 2)
            usrReservaTotal.valor = financeiro.valor_to_string_formatado(usrReservaTotal.valor, 2)
            usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida)
          }
          //carrega dados novo registro do usuário
          chave = rowDados.chave              
          usr =  {
            banco: rowDados.cad_banco,
            agencia: rowDados.cad_agencia,
            conta: rowDados.cad_conta,
            logradouro: rowDados.cad_logradouro, 
            complemento: rowDados.cad_complemento, 
            numero: rowDados.cad_numero, 
            bairro: rowDados.cad_bairro, 
            cidade: rowDados.cad_cidade, 
            uf: rowDados.cad_uf, 
            cep: rowDados.cad_cep,
            telefone: rowDados.cad_telefone, 
            celular: rowDados.cad_celular, 
            email: rowDados.cad_email,	 
            cpf: rowDados.cad_cpf,
            estadocivil: rowDados.cad_estadocivil,
            sexo: rowDados.cad_sexo,
            perfil: rowDados.res_perfil,
            apelido: rowDados.cad_apelido,
            matricula: rowDados.cad_matricula,
            nome: rowDados.cad_nome,
            plano: rowDados.cad_plano,
            tipoPlano: rowDados.cad_tipo_plano,
            segmento: validaSegmento(chave),
            competencia: dataBase.substring(0,7),
            nasc: utils.dateFormat(rowDados.cad_nasc, false, false),
            dataadesao: utils.dateFormat(rowDados.cad_dataadesao, false, false),
            taxa: 5.000000,
            idade: rowDados.cad_idade,
            sitPart: rowDados.cad_sitpart
          }
          
          //Bloco estrutura valores de contribuição
          listaItensContribuicaoChave = []
          listaValoresContribuicaoChave = []
          usuarioTotalContr =  {
            color: "<<seg_contribuicao.total.color>>",
            nome: "Contribuição total",
            valor: 0
          }
          usuarioContrib = {
            contribParticipante: 0,
            contribParticipantePlanoPatrocinado: 0,
            contribEmpresa: 0,
            contribRisco: 0
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
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldototal,2)
          }
          listaItensReservaChave[1] = {
            cor: '<<seg_saldo_reserva.itens.1.cor>>',
            nome: rowDados.res_nomesaldoparticipante,
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldoparticipante,2)
          }
          listaItensReservaChave[2] = {
            cor: '<<seg_saldo_reserva.itens.2.cor>>',
            nome: rowDados.res_nomesaldopj,
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldopj,2)
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
          let capitalMorte = rowDados.cob_capitalmorte !== null ? financeiro.valor_to_string_formatado(rowDados.cob_capitalmorte,2) : 0
          listaItensCoberturas[0] = {
            cor: '<<seg_coberturas.lista_itens_coberturas.0.cor>>',
            nome: rowDados.cob_nomecapitalmorte,
            valor: capitalMorte === 0 ? '(não contratado)' : capitalMorte
          }
          //Invalidez
          let capitalInvalidez = rowDados.cob_capitalinvalidez !== null ? financeiro.valor_to_string_formatado(rowDados.cob_capitalinvalidez,2) : 0
          listaItensCoberturas[1] = {
            cor: '<<seg_coberturas.lista_itens_coberturas.1.cor>>',
            nome: rowDados.cob_nomecapitalinvalidez,
            valor: capitalInvalidez === 0 ? '(não contratado)' : capitalInvalidez
          }
  
          //Bloco estrutura valores projeto de vida
          //cobertura por morte
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
            valor: capitalMorte === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalMorte,2)
          }
  
          //cobertura por Invalidez
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
            valor: capitalInvalidez === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalInvalidez,2)
          }            
  
        } 
  
        let éContribSaldo = false, éContribSaldo13 = false, éContribSaldoPartPlanoPatroc = false, éContribSeguro = false, éContribPartEmpresa = false

        if (rowDados.contr_eventocod !== null) {
          éContribSaldo = listaContribSaldo.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSaldo13 = listaContribSaldo13.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSaldoPartPlanoPatroc = listaContribSaldoPartPlanoPatroc.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSeguro = listaContribSeguro.indexOf(rowDados.contr_eventocod.toString()) >= 0  
          éContribPartEmpresa = listaContribSaldoPartEmpresa.indexOf(rowDados.contr_eventocod.toString()) >= 0  
        }
        //console.log('***> rowDados.contr_eventocod', rowDados.contr_eventocod, contribSaldo, contribSaldo13, contribSaldoPartPlanoPatroc, contribSeguro)
        if (éContribSaldo || éContribSaldo13 || éContribSaldoPartPlanoPatroc || éContribSeguro || éContribPartEmpresa) {
          listaItensContribuicaoChave.push({
            cor: `<<seg_contribuicao.itens.${rowDados.contr_eventocod}.cor>>`,
            nome: rowDados.contr_eventonome,
            valor: financeiro.valor_to_string_formatado(rowDados.contr_valor, 2)
          })
          listaValoresContribuicaoChave.push(rowDados.contr_valor)
          usuarioTotalContr.valor += rowDados.contr_valor
          if (éContribSaldo || éContribSaldo13) { 
            usuarioContrib.contribParticipante += rowDados.contr_valor
          }  
          if (usr.tipoPlano === 'jmalucelli' && éContribSaldoPartPlanoPatroc) {
            usuarioContrib.contribParticipantePlanoPatrocinado += rowDados.contr_valor
          }
          if (éContribSeguro) {
            usuarioContrib.contribRisco += rowDados.contr_valor
          }
          if (éContribPartEmpresa) {
            usuarioContrib.contribEmpresa += rowDados.contr_valor
          }
        }  
      } 
    })

    if (chave!=='') {
      let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'completo', usr.idade, usr.tipoPlano)          
      let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje', usr.idade, usr.tipoPlano)                    
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
        valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[3],2)
      }            
      listaItensProjetoDeVidaProjecao[1] = {
        cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
        nome: 'Reserva projetada',
        valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[2],2)
      }     

      listaMesesProjetoDeVida = retGraficoReservaCompleto[1]

      //salva informações acumuladas do usuário
      usuarios = incluiUsuarioCadastroJSON (usuarios, chave, usr)
      usuarios = incluiUsuarioValoresJSON (usuarios, chave, usuarioContrib, usrReservaTotal.valor, Number(retGraficoReservaCompleto[2]), Number(retGraficoReservaCompleto[3]), usuarioTotalContr.valor)
      usuarios = incluiUsuarioHistContribJSON(usuarios, chave, usuarioContrib, anoMes)
      usuarioTotalContr.valor = financeiro.valor_to_string_formatado(usuarioTotalContr.valor, 2)
      usrReservaTotal.valor = financeiro.valor_to_string_formatado(usrReservaTotal.valor, 2)
      usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida)
    }
    
    //insere registros de testes
    usuarios = insereRegistroTestesHome(usuarios, '9999-0001', 'Leandro')
    usuarios = insereRegistroTestesHome(usuarios, '9999-0002', 'Juliano')

    //salva dados anteriores dos usuários em usuariosHistorico
    ref = admin.database().ref('usuariosHistorico')
    let usrHistorico = {}
    usrHistorico[dataProcessamento] = JSON.stringify(usrAnterior)
    return ref.update(usrHistorico).then(() => {
      //ref = admin.database().ref('usuarios')
      //return ref.remove() //apaga para garantir que somente participantes da base na competência terão valores disponiveis para o app
    //}).then(() => {      
      console.log('#pgCarga - finalizando carga - salvando usuários: ', JSON.stringify(usuarios))
      ref = admin.database().ref(`usuarios`)
      //primeiro salva usuário bloqueados pelo processamento
      ref.update(usuariosBloquear)
      //salva usuário processados com sucesso
      return ref.update(usuarios)
    }).then(() => {
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com sucesso'
      logProcessamento[dataProcessamento].qtd_participantes_carregados = Object.keys(usuarios).length
      logProcessamento[dataProcessamento].qtd_participantes_bloqueados = Object.keys(usuariosBloquear).length
      logProcessamento[dataProcessamento].msg = 'Processamento finalizado com sucesso.'
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          
      console.log('#pgCarga - dados atualizados dos usuários foram salvos com sucesso.')
    }).catch((e) => {
      console.error('#pgCarga - erro ao final do processo. Dados não foram salvos.', e)
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com erro'
      logProcessamento[dataProcessamento].msg = 'Erro ao final do processo. Dados não foram salvos.'
      logProcessamento[dataProcessamento].erro = e
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          

    })

  })


})

function incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida) {
  //carrega estrutura da Home
  usuarios[chave].home = {
    usr_vigente: true,
    usr_competencia: usr.competencia,
    usr_apelido: usr.apelido,
    usr_matricula: usr.matricula,
    usr_nome: usr.nome,
    usr_plano: usr.plano,
    usr_tipo_plano: usr.tipoPlano,
    usr_dtnasc: usr.nasc,
    usr_dtadesao: usr.dataadesao,
    usr_situacao_plano: usr.sitPart,
    segmento: validaSegmento(chave),
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
  }

  return usuarios
}


function incluiUsuarioValoresJSON (usuarios, chave, listaUsuarioContrib, reservaHoje, reservaFutura, rendaFutura, totalContrib) { 
  //carrega estrutura de informações
  usuarios[chave].valores = {
    contribParticipante: listaUsuarioContrib.contribParticipante,
    contribParticipantePlanoPatrocinado: listaUsuarioContrib.contribParticipantePlanoPatrocinado,
    contribEmpresa: listaUsuarioContrib.contribEmpresa,
    contribRisco: listaUsuarioContrib.contribRisco,
    contribTotal: totalContrib,
    reservaTotalAtual: reservaHoje,
    reservaTotalFutura: reservaFutura,
    rendaMensalFutura: rendaFutura
  }

  return usuarios
}

function incluiUsuarioHistContribJSON (usuarios, chave, listaUsuarioContrib, anoMes) { 
  //carrega estrutura de informações
  let anoMesJson = {}
  anoMesJson[anoMes] = {
    valor: listaUsuarioContrib.contribParticipante + listaUsuarioContrib.contribParticipantePlanoPatrocinado + listaUsuarioContrib.contribRisco,
    linkBoleto: '',
    pago: true
  }
  usuarios[chave].valores.historicoContribuicoes = anoMesJson

  return usuarios
}

function incluiUsuarioCadastroJSON(usuarios, chave, usr) {
  let cadastro = {
    dados_bancarios: {
      banco: usr.banco ? usr.banco : '',
      agencia: usr.agencia ? usr.agencia : '',
      conta: usr.conta ? usr.conta : ''
    },
    dados_plano: {
      data_adesao: usr.dataadesao,
      matricula: usr.matricula,
      perfil_investimento: usr.perfil,
      plano: usr.plano
    },
    endereco: {
      logradouro: usr.logradouro, 
      complemento: usr.complemento ? usr.complemento : '', 
      numero: usr.numero ? usr.numero : '', 
      bairro: usr.bairro ? usr.bairro : '', 
      cidade: usr.cidade ? usr.cidade : '', 
      uf: usr.uf ? usr.uf : '', 
      cep: usr.cep ? usr.cep : ''
    },
    informacoes_pessoais: {
      fone_fixo: usr.telefone ? usr.telefone : '', 
      celular: usr.celular ? usr.celular : '', 
      email: usr.email ? usr.email : '',	 
      cpf: usr.cpf ? usr.cpf : '',
      estado_civil: usr.estadocivil ? usr.estadocivil : '',
      sexo: usr.sexo ? usr.sexo : '',
      nome: usr.nome ? usr.nome : '',
      nascimento: usr.nasc ? usr.nasc : ''
    }
  }

  if (usuarios[chave]) { //se já há registro anterior do usuário, só atualiza
    usuarios[chave].cadastro = cadastro
  } else { //caso contrário, cria o objeto dentro do usuario
    usuarios[chave] = {
      cadastro: cadastro
    }
  }

  
  return usuarios
}
  
function calculaGraficoReserva(valorHoje, listaUsuarioContrib, dataNasc, dataAdesao, taxa, amplitude, idade, tipoPlano) {

  let retDataset = {
    0: 0    
  }
  let retListaMeses = {
    0: "Adesão"
  }

  //calculo da reserva aos 65 anos ou a idade + 5 se for mais velho que 65..
  let idadeApos = 65
  if (idade > '64') {
    idadeApos = Number(idade) + 5
  }

  //calculo de datas e tempos
  let dataAposentadoria = financeiro.calculaDataInicioRenda(dataNasc, idadeApos)
  let difMesesHojeAposentadoria = utils.diffDatasEmMeses(new Date(), dataAposentadoria)
  let difMesesDaAdesaoAposentadoria = utils.diffDatasEmMeses(dataAdesao, dataAposentadoria)
  let difMesesDaAdesaoHoje = utils.diffDatasEmMeses(dataAdesao, new Date())

  let valorReservaAposentadoria = financeiro.calculaReservaFutura(valorHoje, taxa, listaUsuarioContrib.contribParticipante, listaUsuarioContrib.contribParticipantePlanoPatrocinado, listaUsuarioContrib.contribEmpresa, dataAposentadoria, tipoPlano)
  //console.log('***> valorReservaAposentadoria', valorReservaAposentadoria)
  let valorRendaAposentadoria = financeiro.calculaRendaFutura(valorReservaAposentadoria, taxa, (15*12)) //calculo de renda por 15 anos            
  //console.log('***> valorRendaAposentadoria', valorRendaAposentadoria)
  
  //monta array de Idades (EIXO X DO GRÀFICO) de acordo com a Adesão e idadeAposentadoria
  let crescPorFaixas = difMesesDaAdesaoAposentadoria / 5
  let aIdades = [
      1, 
      Math.trunc(1 + (crescPorFaixas)), 
      Math.trunc(1 + (crescPorFaixas * 2)), 
      Math.trunc(1 + (crescPorFaixas * 3)), 
      Math.trunc(1 + (crescPorFaixas * 4)), 
      difMesesDaAdesaoAposentadoria
  ]

  let aDistribCurvaGrafico = [
    0, 0.40, 0.55, 0.70, 0.85, 1
  ]

  let aDistribuicaoValores = [
    0,
    valorReservaAposentadoria / 5,
    valorReservaAposentadoria / 5 * 2,
    valorReservaAposentadoria / 5 * 3,
    valorReservaAposentadoria / 5 * 4,
    valorReservaAposentadoria
  ]

  //console.log('==> valorReservaAposentadoria', valorReservaAposentadoria, ' - aIdades', aIdades, ' - valorHoje', valorHoje, ' - difMesesHojeAposentadoria',difMesesHojeAposentadoria)
  for (let linha in aIdades) {
    let dif = aIdades[linha] - difMesesDaAdesaoHoje    
    if (linha > 0) {
      if (dif < 0) { 
        retDataset[linha] = aDistribuicaoValores[linha] * aDistribCurvaGrafico[linha]
        retListaMeses[linha] = ''        
      } else {
        if (dif <= crescPorFaixas) { //posiciona o valor do mês atual
          retListaMeses[linha] = 'Hoje'        
          retDataset[linha] = aDistribuicaoValores[linha] * aDistribCurvaGrafico[linha]
          if (amplitude==='até hoje') {
            break 
          }
        } else { 
          retListaMeses[linha] = ''     
          retDataset[linha] = aDistribuicaoValores[linha] * aDistribCurvaGrafico[linha]
        }
      }  
    }
  }

  if (amplitude==='completo') {
    retListaMeses[5] = `${idadeApos} anos`     
    retDataset[5] = valorReservaAposentadoria    //inclui valor projetado de 65 anos na última faixa
  }

  return [retDataset, retListaMeses, valorReservaAposentadoria, valorRendaAposentadoria]
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
  console.log('#buscaDadosPG - Iniciando - select:', select)

  return getConnection().then( async (pgConn) => {
    console.log('#buscaDadosPG - Banco conectado.')
    let result = await pgConn.query(select)
    let ret
    if (!result) {
      console.error('#pgCarga - buscaDadosPG - retorno da query vazio.')
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
    console.error('#pgCarga - buscaDadosPG - Erro na conexão ao PG:',e);
    logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
    logProcessamento[dataProcessamento].status = 'Finalizado com erro'
    logProcessamento[dataProcessamento].msg = 'Erro na conexão ao banco de dados.'
    logProcessamento[dataProcessamento].erro = e
    let refProc = admin.database().ref(`admin/carga/logProcessamento`)
    refProc.update(logProcessamento)          
    return false
  })
}

function insereRegistroTestesHome(usuarios, chave, apelido){

  usuarios[chave] = {
    "home": {
      "usr_vigente" : true,
      "usr_tipo_plano" : 'instituido',
      "usr_apelido" : apelido,
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
          "valor_cobertura_potencial" : "1 Mi",
          "vigente": true
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
          "valor_deducao_potencial" : "400,00",
          "vigente": true        
        },
        "lista_itens_contribuicao" : {
            "participante" : {
              "eventos" : [ {
                "cor" : "<<seg_contribuicao.itens.0.cor>>",
                "nome" : "maisfuturo previdência",
                "valor" : "178,70"
              }],
              "nome" : "Contribuição Participante",
              "valor" : "178,70"
            }, 
            "patronal" : {
              "eventos" : [ {
                "cor" : "<<seg_contribuicao.itens.1.cor>>",
                "nome" : "maisfuturo Pj",
                "valor" : "32,70"
              }],
              "nome" : "Contribuição PJ",
              "valor" : "32,70"
            },
            "seguro" : {
              "eventos" : [ {
                "cor" : "<<seg_contribuicao.itens.1.cor>>",
                "nome" : "Cobertura | morte",
                "valor" : "40,96"
              }, {
                "cor" : "<<seg_contribuicao.itens.2.cor>>",
                "nome" : "Cobertura | invalidez",
                "valor" : "47,56"
              }],
              "nome" : "Contribuição de riscos",
              "valor" : "88,52"
            }
          },
        "lista_valores_contribuicao" : [ 178.70, 32.70, 40.96, 47.56],
        "total" : {
          "color" : "<<seg_contribuicao.total.color>>",
          "nome" : "Contribuição total",
          "valor" : "299,92"
        },
        "vigente" : true
      },
      "usr_matricula" : "0001",
      "usr_nome" : "JULIANO RIBEIRO KOSNY",
      "usr_projeto_vida" : {
        "acao" : {
          "valor_renda_potencial" : "3.000,00",
          "valor_reserva_potencial" : "1 mi",
          "vigente": true
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
    },
    "data": {
      "valores" : {
        "contribParticipante" : 0,
        "contribParticipantePlanoPatrocinado" : 178.70,
        "contribEmpresa" : 32.70,
        "contribRisco": 88.52,
        "rendaMensalFutura" : 543.67,
        "reservaTotalAtual" : 34436.16,
        "reservaTotalFutura" : 100468.42
      },
      "cadastro": {
        "dados_bancarios" : {
          "agencia" : "0001",
          "banco" : "Nubank",
          "conta_corrente" : "04227-4"
        },
        "dados_plano" : {
          "data_adesao" : "16/05/2019",
          "matricula" : 1234.8879,
          "perfil_investimento" : "Agressivo",
          "plano" : "maisfuturo"
        },
        "endereco" : {
          "bairro" : "Santa Cândida",
          "cep" : "82.650-450",
          "cidade" : "Curitiba",
          "complemento" : "apto 2",
          "estado" : "PR",
          "logradouro" : "rua sapopema",
          "numero" : 242
        },
        "informacoes_pessoais" : {
          "celular" : "41 98777-4114",
          "cpf" : "024.057.899-65",
          "email" : "julianokosny@hotmail.com",
          "estado_civil" : "casado",
          "fone_fixo" : "41 3357 8641",
          "nascimento" : "18/06/1978",
          "nome" : "Juliano Ribeiro Kosny",
          "sexo" : "masculino"
        }    
      }
    }
  
  }
  
  return usuarios
}


function sleep(ms) {
  var waitTill = new Date(new Date().getTime() + ms);
  while(waitTill > new Date()){}  
}  

function groupByArray (xs, key) {
  return xs.reduce(function(rv, x) {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {})
}
