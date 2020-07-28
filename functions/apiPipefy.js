'use strict';
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { GraphQLClient } = require('graphql-request');

try {
  admin.initializeApp();
} catch (e) {}

const runtimeOpts = {
  timeoutSeconds: 60,
  memory: '1GB'
}

exports.default = functions.https.onCall((data, context) => {
    console.log('#apiPipefy - iniciando...')
    if (!context.auth) return {status: 'error', code: 401, message: 'Not signed in'}

    let config = functions.config().portal.integracoes.pipefy

    let header = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.token}`
    }

    const graphQLClient = new GraphQLClient(config.url, {
        headers: header,
    })

    const query = montaQuery(data.body, data.acao)

    return graphQLClient.request(query).then((pData) => {
        console.log('====> pData', pData)
        if (pData) {
            return {sucesso: true, response: pData, erro: null}
        } else {
            return {sucesso: false, response: pData, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
        }      
    }).catch((e) => {
        console.error(`#apiPipefy - Erro na na chamada a ${config[data.idApi]} - erro:`, error)
        return {sucesso: false, response: null, erro: error}
    })
})

function montaQuery(body, acao) {
    const queries = {
        criarCard: 'mutation{ createCard( input: { pipe_id: {{pipeId}} fields_attributes: [ {field_id: "tipo_solicita_o", field_value: [{{tipoSolicitacao}}]} {field_id: "nome_solicitante", field_value: "{{nome}}"} {field_id: "cpf", field_value: "{{cpf}}"} {field_id: "e_mail_solicitante", field_value: "{{email}}"} {field_id: "dados_anteriores", field_value: "{{dadosAnteriores}}"} {field_id: "dados_atualizados", field_value: "{{dadosNovos}}"} {field_id: "data_solicita_o", field_value: "{{dataAgora}}"} {field_id: "origem", field_value: ["Portal"]} ] }',
        consultaCard: '{ card(id: {{pipeId}}) { title assignees { id } comments { text } comments_count current_phase { name } done due_date fields { name value } labels { name } phases_history { phase { name } firstTimeIn lastTimeOut } url } }'    
    }
 
    let query = queries[acao]
    Object.keys(body).forEach((key) => {
        query = query.replace(key, body[key]) //troca o conteudo das chaves
    });
    //pipeId, tipoSolicitacao, nome, cpf, email, dadosAnteriores, dadosNovos, dataAgora
    
    console.log('===> query', query)
    return query

}