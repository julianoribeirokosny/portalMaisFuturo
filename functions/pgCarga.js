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
var periodoBase, anoMes
var taxaAumentoSugestao = 1.20
var select
var stepRenda
var stepInvalidez
var stepMorte
var configCardAcao
var projectId = process.env.GCLOUD_PROJECT

exports.default = functions.runWith(runtimeOpts).database.ref('settings/carga/{plano}/data_base_carga').onWrite(
  async (change, context) => {

  console.log('#pgCarga - iniciando.')

  if (!change.after.exists() || change.after.val()=='') {
    return
  }

  periodoBase = change.after.val()
  anoMes = periodoBase.substring(5, 7) + '/' + periodoBase.substring(0, 4)
  let plano = context.params.plano

  dataProcessamento = utils.dateFormat(new Date(), true, false)
  logProcessamento[dataProcessamento] = {
    tipo: 'Carga Mensal',
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
  let valorContribParticipanteAtual

  //busca configurações dos simuladores de forma async
  stepRenda = 0
  stepMorte = 0
  stepInvalidez = 0
  let ref = admin.database().ref('settings/simulador_renda/'+plano)
  ref.once('value').then((simRenda) => {
    stepRenda = simRenda.val().step_contribuicao
  })
  ref = admin.database().ref('settings/simulador_seguro/'+plano)
  ref.once('value').then((simSeguro) => {
    stepInvalidez = simSeguro.val().step_invalidez
    stepMorte = simSeguro.val().step_morte
  })

  ref = change.after.ref.parent;
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

      if (snapshotParent.child('taxa_aumento_sugestao').val()) {
        taxaAumentoSugestao = snapshotParent.child('taxa_aumento_sugestao').val()
      }
      
      if (snapshotParent.child('card_acao').val()) {
        configCardAcao = snapshotParent.child('card_acao').val()
      }
      
      // Monta comando select com os parametros
      if (snapshotParent.hasChild('lista_chaves_carga')) {
        select = jsonDataSelects.dadosPortalLista
        select = select.replace(/--lista_dados_carga--/g, snapshotParent.child('lista_chaves_carga').val())
      } else {
        select = jsonDataSelects.dadosPortal
      }
      select = select.replace(/--data_base_carga--/g, periodoBase)
      select = select.replace(/--nome_plano--/g, plano)
      console.log('===> select', select)        
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
    let listaItensContribuicaoChave = {
      participante: { eventos: [], nome: 'Contribuição participante', valor: 0},
      patronal: { eventos: [], nome: 'Contribuição empresa', valor: 0}, 
      seguro: { eventos: [], nome: 'Contribuição de risco', valor: 0}
    }
    let listaValoresContribuicaoChave = [], listaItensReservaChave = {}, listaValoresReservaChave = {}, usrReservaTotal = {}, usuarioTotalContr ={}, listaItensCoberturas = {}, listaDatasetsProjetoDeVida = {}, listaItensProjetoDeVidaProjecao = {}, listaItensProjetoDeVidaCoberturas = {},listaMesesProjetoDeVida = {}
    let usuarioContrib = {
      contribParticipante: 0,
      contribParticipantePlanoPatrocinado: 0,
      contribEmpresa: 0,
      contribRisco: 0
    }
    let usuarioContribCadastro = {
      contribParticipante: 0,
      contribRisco: 0
    }
    let capitalMorte, capitalInvalidez
    let valorRendaProjetada, valorReservaProjetada
    console.log('#pgCarga - iniciando forEach')
    retDadosPG.forEach((rowDados) => {
      periodoBase = utils.dateFormat(rowDados.datacomp, false, true, false)
      periodoBase = periodoBase.substring(4,6)+'/'+periodoBase.substring(0,4)
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
          usr_competencia: periodoBase,
          usr_dtnasc: utils.dateFormat(rowDados.cad_nasc, false, false, true),
          usr_dtadesao: rowDados.cad_dataadesao,
          usr_vigente: false,
          motivo_bloqueio_carga: naoAchouSituacaoPlano ? 'situação não permitida para carga' : 'sem saldo total',
          usr_situacao_plano: rowDados.cad_sitpart
        }
      } else {
        if (chave !== rowDados.chave) {
          //ajusta com contribuições base de cadastro caso não tenha pago contribuições no mês
          if (usuarioContrib.contribParticipante + usuarioContrib.contribParticipantePlanoPatrocinado === 0) {
            usuarioContrib.contribParticipante = usuarioContribCadastro.contribParticipante
            valorContribParticipanteAtual = usuarioContrib.contribParticipante + usuarioContrib.contribParticipantePlanoPatrocinado
            listaItensContribuicaoChave.participante.valor = usuarioContribCadastro.contribParticipante
            listaItensContribuicaoChave.participante.nome = 'Contribuição participante'
            listaItensContribuicaoChave.participante.eventos.push({
              cor: `<<seg_contribuicao.itens.participante.0.cor>>`,
              nome: 'Contribuição Normal participante',
              valor: financeiro.valor_to_string_formatado(usuarioContribCadastro.contribParticipante, 2, false)
            })  
            listaValoresContribuicaoChave.push(usuarioContribCadastro.contribParticipante)            
          }
    
          if (usuarioContrib.contribRisco === 0) {
            usuarioContrib.contribRisco = usuarioContribCadastro.contribRisco
            listaItensContribuicaoChave.seguro.valor = usuarioContribCadastro.contribRisco
            listaItensContribuicaoChave.seguro.nome = 'Contribuição de risco'
            listaItensContribuicaoChave.seguro.eventos.push({
              cor: `<<seg_contribuicao.itens.seguro.0.cor>>`,
              nome: 'Contribuição de risco total',
              valor: financeiro.valor_to_string_formatado(usuarioContribCadastro.contribRisco, 2, false)
            })  
            listaValoresContribuicaoChave.push(0) //força a parte empresa por conta do gráfico
            listaValoresContribuicaoChave.push(usuarioContribCadastro.contribRisco)    
          }
          if (usuarioTotalContr.valor === 0) {
            usuarioTotalContr.valor = usuarioContribCadastro.contribParticipante + usuarioContribCadastro.contribRisco
          } 

          if (chave !== '') { 
            let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'completo', usr.idade, usr.tipoPlano, usr.taxaAposentadoria, usr.sitpart)          
            let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje', usr.idade, usr.tipoPlano, usr.taxaAposentadoria, usr.sitpart)                    
            listaDatasetsProjetoDeVida[2] = {
              backgroundColor: "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
              borderColor: "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
              borderWidth: "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
              label: 'Saldo Total',
              data: retGraficoReservaCompleto[0]
            }
            listaDatasetsProjetoDeVida[3] = {
              backgroundColor: "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
              borderColor: "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
              borderWidth: "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
              label: 'Saldo Total',
              data: retGraficoReservaAteHoje[0]
            }          
  
            listaItensProjetoDeVidaProjecao[0] = {
              cor: '<<seg_projeto_vida.itens.projecao.0.cor>>',
              nome: 'Renda Projetada',
              valor: Number(retGraficoReservaCompleto[3])
            }            
            listaItensProjetoDeVidaProjecao[1] = {
              cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
              nome: 'Saldo Projetado',
              valor: Number(retGraficoReservaCompleto[2])
            }     
            
            if (retGraficoReservaCompleto[4] > 0) {
              valorContribParticipanteAtual = retGraficoReservaCompleto[4] 
            }      

            listaMesesProjetoDeVida = retGraficoReservaCompleto[1]
  
            //salva informações acumuladas do usuário
            usuarios = incluiUsuarioCadastroJSON (usuarios, chave, usr)
            usuarios = incluiUsuarioValoresJSON (usuarios, chave, usuarioContrib, usrReservaTotal.valor, Number(retGraficoReservaCompleto[2]), Number(retGraficoReservaCompleto[3]), usuarioTotalContr.valor, capitalMorte, capitalInvalidez)
            usuarios = incluiUsuarioHistContribJSON(usuarios, chave, usuarioContrib, anoMes)            
            usuarioTotalContr.valor = financeiro.valor_to_string_formatado(usuarioTotalContr.valor, 2, false)
            usrReservaTotal.valor = financeiro.valor_to_string_formatado(usrReservaTotal.valor, 2, false)
            valorReservaProjetada = retGraficoReservaCompleto[5]
            valorRendaProjetada = retGraficoReservaCompleto[6]
            usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida, valorContribParticipanteAtual, valorReservaProjetada, valorRendaProjetada)
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
            competencia: periodoBase,
            nasc: utils.dateFormat(rowDados.cad_nasc, false, false, true),
            dataadesao: utils.dateFormat(rowDados.cad_dataadesao, false, false, true),
            taxa: 5.000000,
            taxaAposentadoria: 4.500000,
            idade: rowDados.cad_idade,
            sitPart: rowDados.cad_sitpart
          }
          
          //Bloco estrutura valores de contribuição
          listaItensContribuicaoChave = {
            participante: { eventos: [], nome: 'Contribuição participante', valor: 0},
            patronal: { eventos: [], nome: 'Contribuição empresa', valor: 0}, 
            seguro: { eventos: [], nome: 'Contribuição de risco', valor: 0}
          }      
          listaValoresContribuicaoChave = []
          usuarioTotalContr =  {
            color: "<<seg_contribuicao.total.color>>",
            nome: "Contribuição Total",
            valor: 0
          }
          usuarioContrib = {
            contribParticipante: 0,
            contribParticipantePlanoPatrocinado: 0,
            contribEmpresa: 0,
            contribRisco: 0
          }
          usuarioContribCadastro = {
            contribParticipante: 0,
            contribRisco: 0
          }

          listaItensReservaChave = {}  
          listaValoresReservaChave = {} 
          listaItensCoberturas = {}
          listaDatasetsProjetoDeVida = {}
          listaItensProjetoDeVidaProjecao = {}
          listaItensProjetoDeVidaCoberturas = {}
          listaMesesProjetoDeVida = {}
          capitalMorte = 0
          capitalInvalidez = 0
          valorRendaProjetada = 0
          valorReservaProjetada = 0
  
          //Bloco estrutura valores de Reserva
          listaItensReservaChave[0] = {
            cor: '<<seg_saldo_reserva.itens.0.cor>>',
            nome: rowDados.res_nomesaldototal,
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldototal, 2, false)
          }
          listaItensReservaChave[1] = {
            cor: '<<seg_saldo_reserva.itens.1.cor>>',
            nome: rowDados.res_nomesaldoparticipante,
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldoparticipante, 2, false)
          }
          listaItensReservaChave[2] = {
            cor: '<<seg_saldo_reserva.itens.2.cor>>',
            nome: rowDados.res_nomesaldopj,
            valor: financeiro.valor_to_string_formatado(rowDados.res_saldopj, 2, false)
          }
          listaValoresReservaChave[0] = rowDados.res_saldoparticipante
          listaValoresReservaChave[1] = rowDados.res_saldopj
          usrReservaTotal = {
            color: '<<seg_saldo_reserva.total.color>>',
            nome: 'Saldo Total',
            valor: rowDados.res_saldototal
          }
  
          //Bloco estrutura valores cobertura risco/seguro
          //MOrte
          capitalMorte = rowDados.cob_capitalmorte !== null ? rowDados.cob_capitalmorte : 0
          listaItensCoberturas[0] = {
            cor: '<<seg_coberturas.lista_itens_coberturas.0.cor>>',
            nome: rowDados.cob_nomecapitalmorte,
            //valor: capitalMorte === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalMorte, 2, false)
            valor: capitalMorte
          }
          //Invalidez
          capitalInvalidez = rowDados.cob_capitalinvalidez !== null ? rowDados.cob_capitalinvalidez : 0
          listaItensCoberturas[1] = {
            cor: '<<seg_coberturas.lista_itens_coberturas.1.cor>>',
            nome: rowDados.cob_nomecapitalinvalidez,
            //valor: capitalInvalidez === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalInvalidez, 2, false)
            valor: capitalInvalidez
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
            //valor: capitalMorte === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalMorte, 2, false)
            valor: capitalMorte
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
            //valor: capitalInvalidez === 0 ? '(não contratado)' : financeiro.valor_to_string_formatado(capitalInvalidez, 2, false)
            valor: capitalInvalidez
          }            
  
        } 
  
        usuarioContribCadastro.contribParticipante = rowDados.cad_valorcontr === null ? 0 : rowDados.cad_valorcontr
        usuarioContribCadastro.contribRisco = rowDados.cob_premiomorte === null ? 0 : rowDados.cob_premiomorte
        if (rowDados.cob_premioinvalidez !== null) {
          usuarioContribCadastro.contribRisco += rowDados.cob_premioinvalidez
        }

        let éContribSaldo = false, éContribSaldo13 = false, éContribSaldoPartPlanoPatroc = false, éContribSeguro = false, éContribPartEmpresa = false

        if (rowDados.contr_eventocod !== null) {
          éContribSaldo = listaContribSaldo.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSaldo13 = listaContribSaldo13.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSaldoPartPlanoPatroc = listaContribSaldoPartPlanoPatroc.indexOf(rowDados.contr_eventocod.toString()) >= 0 
          éContribSeguro = listaContribSeguro.indexOf(rowDados.contr_eventocod.toString()) >= 0  
          éContribPartEmpresa = listaContribSaldoPartEmpresa.indexOf(rowDados.contr_eventocod.toString()) >= 0  
        }
        if (éContribSaldo || éContribSaldo13 || éContribSaldoPartPlanoPatroc || éContribSeguro || éContribPartEmpresa) {
          usuarioTotalContr.valor += rowDados.contr_valor
          listaValoresContribuicaoChave.push(rowDados.contr_valor)
          if (usr.tipoPlano === 'jmalucelli' && éContribSaldoPartPlanoPatroc) {
            usuarioContrib.contribParticipantePlanoPatrocinado += rowDados.contr_valor
          }

          if (éContribSaldo || éContribSaldo13) { 
            usuarioContrib.contribParticipante += rowDados.contr_valor
          }  

          if (éContribSaldo || éContribSaldo13 || éContribSaldoPartPlanoPatroc) { 
            listaItensContribuicaoChave.participante.nome = 'Contribuição participante'
            listaItensContribuicaoChave.participante.valor += rowDados.contr_valor
            listaItensContribuicaoChave.participante.eventos.push({
              cor: `<<seg_contribuicao.itens.participante.${listaItensContribuicaoChave.participante.eventos.length}.cor>>`,
              nome: rowDados.contr_eventonome,
              valor: financeiro.valor_to_string_formatado(rowDados.contr_valor, 2, false)
            })  
          }  

          if (éContribSeguro) {
            usuarioContrib.contribRisco += rowDados.contr_valor
            listaItensContribuicaoChave.seguro.nome = 'Contribuição de risco'
            listaItensContribuicaoChave.seguro.valor += rowDados.contr_valor            
            listaItensContribuicaoChave.seguro.eventos.push({
              cor: `<<seg_contribuicao.itens.seguro.${listaItensContribuicaoChave.seguro.eventos.length}.cor>>`,
              nome: rowDados.contr_eventonome,
              valor: financeiro.valor_to_string_formatado(rowDados.contr_valor, 2, false)
            })  
          }
          if (éContribPartEmpresa) {
            usuarioContrib.contribEmpresa += rowDados.contr_valor
            listaItensContribuicaoChave.patronal.nome = 'Contribuição empresa'
            listaItensContribuicaoChave.patronal.valor += rowDados.contr_valor                        
            listaItensContribuicaoChave.patronal.eventos.push({
              cor: `<<seg_contribuicao.itens.patronal.${listaItensContribuicaoChave.patronal.eventos.length}.cor>>`,
              nome: rowDados.contr_eventonome,
              valor: financeiro.valor_to_string_formatado(rowDados.contr_valor, 2, false)
            })  
          }
        }  
      } 
    })

    if (chave!=='') {
      //ajusta com contribuições base de cadastro caso não tenha pago contribuições no mês
      if (usuarioContrib.contribParticipante + usuarioContrib.contribParticipantePlanoPatrocinado === 0) {
        usuarioContrib.contribParticipante = usuarioContribCadastro.contribParticipante
        valorContribParticipanteAtual = usuarioContrib.contribParticipante + usuarioContrib.contribParticipantePlanoPatrocinado
        listaItensContribuicaoChave.participante.valor = usuarioContribCadastro.contribParticipante
        listaItensContribuicaoChave.participante.nome = 'Contribuição participante'
        listaItensContribuicaoChave.participante.eventos.push({
          cor: `<<seg_contribuicao.itens.participante.0.cor>>`,
          nome: 'Contribuição Normal participante',
          valor: financeiro.valor_to_string_formatado(usuarioContribCadastro.contribParticipante, 2, false)
        })  
        listaValoresContribuicaoChave.push(usuarioContribCadastro.contribParticipante)
      }

      if (usuarioContrib.contribRisco === 0) {
        usuarioContrib.contribRisco = usuarioContribCadastro.contribRisco
        listaItensContribuicaoChave.seguro.valor = usuarioContribCadastro.contribRisco
        listaItensContribuicaoChave.seguro.nome = 'Contribuição de risco'
        listaItensContribuicaoChave.seguro.eventos.push({
          cor: `<<seg_contribuicao.itens.seguro.0.cor>>`,
          nome: 'Contribuição de risco total',
          valor: financeiro.valor_to_string_formatado(usuarioContribCadastro.contribRisco, 2, false)
        })  
        listaValoresContribuicaoChave.push(0) //força a parte empresa por conta do gráfico
        listaValoresContribuicaoChave.push(usuarioContribCadastro.contribRisco)
      }
      if (usuarioTotalContr.valor === 0) {
        usuarioTotalContr.valor = usuarioContribCadastro.contribParticipante + usuarioContribCadastro.contribRisco
      } 

      let retGraficoReservaCompleto = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'completo', usr.idade, usr.tipoPlano, usr.taxaAposentadoria, usr.sitpart)          
      let retGraficoReservaAteHoje = calculaGraficoReserva(usrReservaTotal.valor, usuarioContrib, usr.nasc, usr.dataadesao, usr.taxa, 'até hoje', usr.idade, usr.tipoPlano, usr.taxaAposentadoria, usr.sitpart)                    
      listaDatasetsProjetoDeVida[2] = {
        backgroundColor: "<<seg_projeto_vida.grafico.datasets.2.backgroundColor>>",
        borderColor: "<<seg_projeto_vida.grafico.datasets.2.borderColor>>",
        borderWidth: "<<seg_projeto_vida.grafico.datasets.2.borderWidth>>",
        label: 'Saldo Total',
        data: retGraficoReservaCompleto[0]
      }
      listaDatasetsProjetoDeVida[3] = {
        backgroundColor: "<<seg_projeto_vida.grafico.datasets.3.backgroundColor>>",
        borderColor: "<<seg_projeto_vida.grafico.datasets.3.borderColor>>",
        borderWidth: "<<seg_projeto_vida.grafico.datasets.3.borderWidth>>",
        label: 'Saldo Total',
        data: retGraficoReservaAteHoje[0]
      }          
      listaItensProjetoDeVidaProjecao[0] = {
        cor: '<<seg_projeto_vida.itens.projecao.0.cor>>',
        nome: 'Renda Projetada',
        //valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[3], 2, false)
        valor: Number(retGraficoReservaCompleto[3])
      }            
      listaItensProjetoDeVidaProjecao[1] = {
        cor: '<<seg_projeto_vida.itens.projecao.1.cor>>',
        nome: 'Saldo Projetado',
        //valor: financeiro.valor_to_string_formatado(retGraficoReservaCompleto[2], 2, false)
        valor: Number(retGraficoReservaCompleto[2])
      }     
      if (retGraficoReservaCompleto[4] > 0) {
        valorContribParticipanteAtual = retGraficoReservaCompleto[4] 
      }      

      listaMesesProjetoDeVida = retGraficoReservaCompleto[1]

      //salva informações acumuladas do usuário
      usuarios = incluiUsuarioCadastroJSON (usuarios, chave, usr)
      usuarios = incluiUsuarioValoresJSON (usuarios, chave, usuarioContrib, usrReservaTotal.valor, Number(retGraficoReservaCompleto[2]), Number(retGraficoReservaCompleto[3]), usuarioTotalContr.valor, capitalMorte, capitalInvalidez)
      usuarios = incluiUsuarioHistContribJSON(usuarios, chave, usuarioContrib, anoMes)
      usuarioTotalContr.valor = financeiro.valor_to_string_formatado(usuarioTotalContr.valor, 2, false)
      usrReservaTotal.valor = financeiro.valor_to_string_formatado(usrReservaTotal.valor, 2, false)
      valorReservaProjetada = retGraficoReservaCompleto[5]
      valorRendaProjetada = retGraficoReservaCompleto[6]
      usuarios = incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida, valorContribParticipanteAtual, valorReservaProjetada, valorRendaProjetada)
    }
    
    //insere registros de testes
    //usuarios = insereRegistroTestesHome(usuarios, '9999-0001', 'Leandro')
    //usuarios = insereRegistroTestesHome(usuarios, '9999-0002', 'Juliano')

    //salva dados anteriores dos usuários em usuariosHistorico
    ref = admin.database().ref('usuariosHistorico')
    let usrHistorico = {}
    usrHistorico[dataProcessamento] = JSON.stringify(usrAnterior)
    //return ref.remove()
    //.then(() => {
    return ref.update(usrHistorico).then(() => {
      //ref = admin.database().ref('usuarios')
      //return ref.remove() 
    //}).then(() => {      
      console.log('#pgCarga - finalizando carga - salvando usuários.')
      ref = admin.database().ref(`usuarios`)
      //primeiro salva usuário bloqueados pelo processamento
      ref.update(usuariosBloquear)
      //salva usuário processados com sucesso
      return ref.update(usuarios)
    }).then(() => {
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com sucesso'
      logProcessamento[dataProcessamento].qtd_participantes_carregados = Object.keys(usuarios).length
      logProcessamento[dataProcessamento].qtd_participantes_bloqueados = (!usuariosBloquear) ? 0 : Object.keys(usuariosBloquear).length
      logProcessamento[dataProcessamento].msg = 'Processamento finalizado com sucesso.'
      console.log('#pgCarga - finalizando carga - Atualizando Log do Processamento ', logProcessamento)
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          
      console.log('#pgCarga - dados atualizados dos usuários foram salvos com sucesso.')
    }).catch((e) => {
      console.error('#pgCarga - erro ao final do processo. Dados não foram salvos.', e)
      logProcessamento[dataProcessamento].fim = utils.dateFormat(new Date(), true, false).substring(-8)
      logProcessamento[dataProcessamento].status = 'Finalizado com erro'
      logProcessamento[dataProcessamento].msg = 'Erro ao final do processo. Dados não foram salvos.'
      logProcessamento[dataProcessamento].erro = JSON.stringify(e)
      let refProc = admin.database().ref(`admin/carga/logProcessamento`)
      refProc.update(logProcessamento)          

    })

  })


})

function incluiUsuarioJSON(usuarios, chave, usr, listaItensContribuicaoChave, listaValoresContribuicaoChave, usuarioTotalContr, listaItensReservaChave, listaValoresReservaChave, usrReservaTotal, listaItensCoberturas, listaDatasetsProjetoDeVida, listaItensProjetoDeVidaProjecao, listaItensProjetoDeVidaCoberturas, listaMesesProjetoDeVida, valorContribParticipanteAtual, reservaPotencial, rendaPotencial) {
  let valorTotal = Number(usuarioTotalContr.valor.replace('.','').replace(',','.'))
  let contribProjetada = calculaContribuicaoProjetada(valorContribParticipanteAtual, 0, usr.sitPart)
  rendaPotencial = financeiro.valorFormatoDesc(rendaPotencial)
  reservaPotencial = financeiro.valorFormatoDesc(reservaPotencial)

  let coberturaPotencial = calculaCoberturaPotencial(listaItensProjetoDeVidaCoberturas)
  //carrega estrutura da Home
  usuarios[chave].home = {
    usr_vigente: true,
    usr_competencia: usr.competencia,
    usr_apelido: mascararDados(usr.apelido, 'string'), 
    usr_matricula: mascararDados(usr.matricula, 'numero-string'),
    usr_nome: mascararDados(usr.nome, 'string'),
    usr_plano: usr.plano,
    usr_tipo_plano: usr.tipoPlano,
    usr_dtnasc: mascararDados(usr.nasc, 'data-string'),
    usr_dtadesao: usr.dataadesao,
    usr_situacao_plano: usr.sitPart,
    segmento: validaSegmento(chave),
    usr_perfil_investimento: usr.perfil,
    usr_taxaPadrao: usr.taxa,
    usr_contribuicao: {
      acao: {
        valor_dif_contribuicao_potencial: contribProjetada[0],
        valor_renda_potencial: rendaPotencial,        
        valor_deducao_potencial: 0, 
        qtd_steps_entrada: contribProjetada[2],
        vigente: configCardAcao && configCardAcao.contribuicao[usr.sitPart] ? true  : "_"
      },
      lista_itens_contribuicao: listaItensContribuicaoChave,
      lista_valores_contribuicao: listaValoresContribuicaoChave.length > 0 ? listaValoresContribuicaoChave : [valorTotal],
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
        valor_cobertura_potencial: coberturaPotencial[0],
        valor_morte_entrada: coberturaPotencial[1],
        valor_invalidez_entrada: coberturaPotencial[1],
        vigente: configCardAcao && configCardAcao.coberturas[usr.sitPart] ? true  : "_"
      },
      lista_itens_coberturas: listaItensCoberturas,
      vigente: true
    },
    usr_projeto_vida : {
      acao: {
        valor_renda_potencial: rendaPotencial,
        valor_reserva_potencial: reservaPotencial, //calculaReservaPotencial(listaItensProjetoDeVidaProjecao[1].valor),
        valor_contribuicao_projetada: contribProjetada[1],
        qtd_steps_entrada: contribProjetada[2],
        vigente: configCardAcao && configCardAcao.projeto_vida[usr.sitPart] ? true  : "_"
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


function incluiUsuarioValoresJSON (usuarios, chave, listaUsuarioContrib, reservaHoje, reservaFutura, rendaFutura, totalContrib, capitalMorte, capitalInvalidez) { 
  //carrega estrutura de informações
  usuarios[chave].data.valores = { 
    contribParticipante: listaUsuarioContrib.contribParticipante,
    contribParticipantePlanoPatrocinado: listaUsuarioContrib.contribParticipantePlanoPatrocinado,
    contribEmpresa: listaUsuarioContrib.contribEmpresa,
    contribRisco: listaUsuarioContrib.contribRisco,
    contribTotal: totalContrib,
    reservaTotalAtual: reservaHoje,
    reservaTotalFutura: reservaFutura,
    rendaMensalFutura: rendaFutura,
    historicoContribuicao: usuarios[chave].valores && usuarios[chave].valores.historicoContribuicao ? usuarios[chave].valores.historicoContribuicao : '',
    coberturaMorte: capitalMorte,
    coberturaInvalidez: capitalInvalidez
  
  }

  return usuarios
}

function incluiUsuarioHistContribJSON (usuarios, chave, listaUsuarioContrib, anoMes) { 

  //carrega estrutura de informações
  let dataJson = {}
  let valorTotalContrib = listaUsuarioContrib.contribParticipante + listaUsuarioContrib.contribParticipantePlanoPatrocinado + listaUsuarioContrib.contribRisco
  let pago = valorTotalContrib > 0
  dataJson = {
    anoMes: anoMes,
    valor: valorTotalContrib,
    linkBoleto: '', //pago ? '' : 'https://firebasestorage.googleapis.com/v0/b/portalmaisfuturo-teste.appspot.com/o/usuarios%2F9999-0002%2Fboleto_201902.pdf?alt=media&token=9bc86daf-40c3-4384-96e7-d1c1e4dd6d80',
    pago: pago
  }
  let historicoMesJson 

  if (usuarios[chave].data.valores.historicoContribuicao === undefined || usuarios[chave].data.valores.historicoContribuicao === '') {
    historicoMesJson = {0: dataJson}
  } else {
    //procedimento abaixo para sempre manter a sequencia
    historicoMesJson = {}
    let item = 0 //usuarios[chave].valores.historicoContribuicao.length
    let achou = false
    //verifica se já não foi carregada
    Object.keys(usuarios[chave].data.valores.historicoContribuicao).forEach((k) => {
      historicoMesJson[item] = usuarios[chave].data.valores.historicoContribuicao[k]
      if (historicoMesJson[item].anoMes === anoMes) {
        historicoMesJson[item] = dataJson  //substitui
        achou = true
      }
      item++
    });
    if (!achou) {
      historicoMesJson[item] = dataJson
    }
  }

  usuarios[chave].data.valores.historicoContribuicao = historicoMesJson

  return usuarios
}

function incluiUsuarioCadastroJSON(usuarios, chave, usr) {
  let cadastro = {
    dados_bancarios: {
      banco: usr.banco ? mascararDados(usr.banco, 'banco') : '',
      agencia: usr.agencia ? mascararDados(usr.agencia, 'agencia') : '',
      conta: usr.conta ? mascararDados(usr.conta, 'conta') : ''
    },
    dados_plano: {
      data_adesao: usr.dataadesao,
      matricula: usr.matricula,
      perfil_investimento: usr.perfil,
      plano: usr.plano
    },
    endereco: {
      logradouro: mascararDados(usr.logradouro, 'logradouro'), 
      complemento: usr.complemento ? mascararDados(usr.complemento, 'string') : '', 
      numero: usr.numero ? mascararDados(usr.numero, 'string') : '', 
      bairro: usr.bairro ? mascararDados(usr.bairro, 'bairro') : '', 
      cidade: usr.cidade ? usr.cidade : '', 
      uf: usr.uf ? usr.uf : '', 
      cep: usr.cep ? usr.cep : ''
    },
    informacoes_pessoais: {
      fone_fixo: usr.telefone ? mascararDados(usr.telefone, 'fone') : '', 
      celular: usr.celular ? mascararDados(usr.celular, 'fone') : '', 
      email: usr.email ? mascararDados(usr.email, 'email') : '',	 
      cpf: usr.cpf ? mascararDados(usr.cpf, 'cpf') : '',
      estado_civil: usr.estadocivil ? usr.estadocivil : '',
      sexo: usr.sexo ? usr.sexo : '',
      nome: usr.nome ? mascararDados(usr.nome, 'string') : '',
      nascimento: usr.nasc ? mascararDados(usr.nasc, 'data-string') : ''
    }
  }

  if (usuarios[chave] !== undefined && usuarios[chave].data !== undefined) { //se já há registro anterior do usuário, só atualiza
    usuarios[chave].data.cadastro = cadastro
  } else { //caso contrário, cria o objeto dentro do usuario
    usuarios[chave] = {
      data: {cadastro: cadastro}
    }
  }

  
  return usuarios
}
  
function calculaGraficoReserva(valorHoje, listaUsuarioContrib, dataNasc, dataAdesao, taxa, amplitude, idade, tipoPlano, taxaAposentadoria, situacaoPlano) {

  let retDataset = {
    0: 0    
  }
  let retListaMeses = {
    0: "Adesão"
  }
  
  //calculo de IdadeApos, datas e tempos
  let idadeApos = calculaIdadeApos(dataNasc, dataAdesao, idade)
  let difMesesDaAdesaoHoje = utils.diffDatasEmMeses(dataAdesao, new Date())
  let dataAposentadoria = financeiro.calculaDataInicioRenda(dataNasc, idadeApos)
  let difMesesHojeAposentadoria = utils.diffDatasEmMeses(new Date(), dataAposentadoria)
  let difMesesDaAdesaoAposentadoria = utils.diffDatasEmMeses(dataAdesao, dataAposentadoria)

  let valorReservaAposentadoria = financeiro.calculaReservaFutura(valorHoje, taxa, listaUsuarioContrib.contribParticipante, listaUsuarioContrib.contribParticipantePlanoPatrocinado, listaUsuarioContrib.contribEmpresa, dataAposentadoria, tipoPlano)
  let valorRendaAposentadoria = financeiro.calculaRendaFutura(valorReservaAposentadoria, taxaAposentadoria, 20, tipoPlano) //calculo de renda por 20 anos             

  let valorContribProjetada = 0
  let valorReservaAposentadoriaProjetada = 0
  let valorRendaAposentadoriaProjetada = 0
  if (amplitude==='completo') {
    valorContribProjetada = calculaContribuicaoProjetada(listaUsuarioContrib.contribParticipante, listaUsuarioContrib.contribParticipantePlanoPatrocinado, situacaoPlano)
    valorReservaAposentadoriaProjetada = financeiro.calculaReservaFutura(valorHoje, taxa, valorContribProjetada[1], listaUsuarioContrib.contribParticipantePlanoPatrocinado, listaUsuarioContrib.contribEmpresa, dataAposentadoria, tipoPlano)
    valorRendaAposentadoriaProjetada = financeiro.calculaRendaFutura(valorReservaAposentadoriaProjetada, taxaAposentadoria, 20, tipoPlano) //calculo de renda por 20 anos             
  }

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

  let hoje = false
  for (let linha in aIdades) {
    let dif = aIdades[linha] - difMesesDaAdesaoHoje 
    if (linha > 0) {
      if (dif < 0) { 
        retDataset[linha] = aDistribuicaoValores[linha] * aDistribCurvaGrafico[linha]
        retListaMeses[linha] = ''        
      } else {
        if (dif <= crescPorFaixas) { //posiciona o valor do mês atual
          retListaMeses[linha] = !hoje ? 'Hoje' : ''
          hoje = true
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

  if (valorHoje===0 && amplitude==='até hoje') { //acontece para alguns participantes...
    retDataset[0] = 0
    retDataset[1] = 0
    retDataset[2] = 0
    retDataset[3] = 0
    retDataset[4] = 0
    retDataset[5] = 0
  }

  return [  retDataset, 
            retListaMeses, 
            valorReservaAposentadoria, 
            valorRendaAposentadoria, 
            listaUsuarioContrib.contribParticipante + listaUsuarioContrib.contribParticipantePlanoPatrocinado, 
            valorReservaAposentadoriaProjetada, 
            valorRendaAposentadoriaProjetada
          ]
}

function calculaContribuicaoProjetada(valorContribParticipanteAtual, valorContribParticipantePatrocAtual, situacaoPlano) {
  let valorDifContribProjetada = (valorContribParticipanteAtual + valorContribParticipantePatrocAtual) * (taxaAumentoSugestao - 1)
  let valorContribProjetada = 0
  let qtdStepsRenda = 1
  if (valorDifContribProjetada < stepRenda) {
    valorContribProjetada = valorContribParticipanteAtual + stepRenda
  } else {
    qtdStepsRenda = Math.trunc(valorDifContribProjetada / stepRenda)
    valorContribProjetada = valorContribParticipanteAtual + (stepRenda * qtdStepsRenda)
  }
  let ret = [financeiro.valorFormatoDesc(valorContribProjetada - valorContribParticipanteAtual), valorContribProjetada, qtdStepsRenda]
  if (situacaoPlano === "Com Contribuição Suspensa") {
    ret = [0, valorContribParticipanteAtual + valorContribParticipantePatrocAtual, 0]
  } 
  return ret
}

function validaSegmento() {
  return 'blue'
}

function calculaCoberturaPotencial(listaItensCoberturas) {
  let coberturaTotal = 0
  let coberturaMorte = listaItensCoberturas[0].valor
  let coberturaInvalidez = listaItensCoberturas[1].valor
  let dif, qtdSteps, qtdStepsValorAtual
  if (coberturaMorte + coberturaInvalidez === 0) {
    let vlr = 100000.00
    return [financeiro.valorFormatoDesc(vlr), vlr]
  } else {
    if (coberturaMorte > 0) {
      dif = coberturaMorte * (1 - taxaAumentoSugestao)
      qtdStepsValorAtual = Math.trunc( coberturaMorte / stepMorte)
      if (dif < stepMorte) {
        coberturaMorte = (qtdStepsValorAtual + 1) * stepMorte
      } else {
        qtdSteps = Math.trunc(dif / stepMorte)
        coberturaMorte = (qtdStepsValorAtual + qtdSteps + 1) * stepMorte
      }
    } 
    if (coberturaInvalidez > 0) {
      dif = coberturaInvalidez * (1 - taxaAumentoSugestao)
      qtdStepsValorAtual = Math.trunc( coberturaInvalidez / stepInvalidez)
      if (dif < stepInvalidez) {
        coberturaInvalidez = (qtdStepsValorAtual + 1) * stepInvalidez
      } else {
        qtdSteps = Math.trunc(dif / stepInvalidez)
        coberturaInvalidez = (qtdStepsValorAtual + qtdSteps + 1) * stepInvalidez
      }
    }

    coberturaTotal = coberturaMorte > coberturaInvalidez ? coberturaMorte : coberturaInvalidez
    return [financeiro.valorFormatoDesc(coberturaTotal), coberturaTotal] //, coberturaMorte, coberturaInvalidez]
  }
}

async function getConnection () {
  let config = functions.config().portal.carga.sinqia
  const pgConfig = {
    max: 1,
    user: config.user,
    password: config.password,
    database: config.database,
    host: config.host
  };
  return new pg.Pool(pgConfig);
}

async function buscaDadosPG(select) {
  return getConnection().then( async (pgConn) => {
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
      "usr_competencia": anoMes,
      "usr_perfil_investimento": "Agressivo",
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
                "nome" : "Cobertura | Morte",
                "valor" : "40,96"
              }, {
                "cor" : "<<seg_contribuicao.itens.2.cor>>",
                "nome" : "Cobertura | Invalidez",
                "valor" : "47,56"
              }],
              "nome" : "Contribuição de riscos",
              "valor" : "88,52"
            }
          },
        "lista_valores_contribuicao" : [ 178.70, 32.70, 40.96, 47.56],
        "total" : {
          "color" : "<<seg_contribuicao.total.color>>",
          "nome" : "Contribuição Total",
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
            "nome" : "Renda Projetada",
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
        "reservaTotalFutura" : 100468.42,
        "historicoContribuicao" : 
          [ {
            "anoMes" : "01/2019",
            "pago" : true,
            "valor" : "40,96"
          }, {
            "anoMes" : "02/2019",
            "pago" : false,
            "linkBoleto": "https://firebasestorage.googleapis.com/v0/b/portalmaisfuturo-teste.appspot.com/o/usuarios%2F9999-0002%2Fboleto_201902.pdf?alt=media&token=9bc86daf-40c3-4384-96e7-d1c1e4dd6d80",
            "valor" : "47,56"
          }, {
            "anoMes" : "03/2019",
            "pago" : false,
            "linkBoleto": "https://firebasestorage.googleapis.com/v0/b/portalmaisfuturo-teste.appspot.com/o/usuarios%2F9999-0002%2Fboleto_201902.pdf?alt=media&token=9bc86daf-40c3-4384-96e7-d1c1e4dd6d80",
            "valor" : "51,56"
          }, {
            "anoMes" : "04/2019",
            "pago" : true,
            "valor" : "47,56"
          } 
        ]
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

function calculaIdadeApos(dataNasc, dataAdesao, idade) {
  let idadeNaAdesao = utils.diffDatasEmAnos(dataNasc, dataAdesao)
  let idadeApos = 65
  if (idadeNaAdesao > 55) {
    idadeApos = idadeNaAdesao + 10
  }
  if (idade > idadeApos) {
    idadeApos = idade
  }

  return idadeApos
}

function mascararDados(info, tipo) {
  let ret = info
  //mascara em DSV e HMG
  if (projectId.indexOf('-hmg') > 0 || projectId.indexOf('-hom') > 0 || projectId.indexOf('-dev') > 0 || projectId.indexOf('-teste') > 0) {
    if (tipo === 'data') {
      ret = new Date(info.getFullYear(), 1, 1)
    } else if (tipo === 'data-string') {
      ret = '01/01/'+info.slice(-4)
    } else if (tipo==="string") {
      ret = info.shuffle()
    } else if (tipo==="numero") {
      ret = Number(info.toString().shuffle())
    } else if (tipo==="numero-string") {
      ret = Number(info.shuffle())
    } else if (tipo==="logradouro") {
      ret = 'Av. Sete de Setembro'
    } else if (tipo==="bairro") {
      ret = 'Batel'
    } else if (tipo==="cep") {
      ret = '80240-000'
    } else if (tipo==="email") {
      ret = 'previdenciadigital@maisfuturo.com.br'
    } else if (tipo==="cpf") {
      ret = '522.691.210-23'
    } else if (tipo==="fone") {
      ret = '(41) 9-9999-9999'
    } else if (tipo==="banco") {
      ret = '237 - BRADESCO'
    } else if (tipo==="conta") {
      ret = '99999 - 9'
    } else if (tipo==="agencia") {
      ret = '9999'
    }  
  }
  return ret
}

String.prototype.shuffle = function () {
  var a = this.split(""),
      n = a.length;

  for(var i = n - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
  }
  return a.join("");
}