const request = require('request-promise');
  
module.exports =  {

    run : function(data, functions, admin) {
        let config = functions.config().portal.integracoes.pipefy

        let header = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.token}`
        }

        let options
        let ref = admin.database().ref(`usuarios/${data.body.chave}/data/cadastro/informacoes_pessoais`)
        let p0 = new Promise((resolve) => {
            if (data.acao === 'criarCard') {
                ref.once('value').then((usuario) => {
                    console.log('====> usuario.val()', usuario.val())
                    if (!usuario) {
                        resolve(null)
                    } else {
                        resolve(usuario.val())
                    }
                })    
            } else {
                resolve(true)
            }
        })

        return p0.then((usr) => {
            if (!usr) {
                return usr
            } else {
                const query = montaQuery(data, config, usr)
                console.log('====> query', query)
            
                options = {
                    url: config.url,
                    method: 'POST',
                    headers: header,
                    body: JSON.stringify({query: query})
                }
            
                //request para a api da previdencia digital solicitada
                return request(options)    
            }    
        }).then((pData) => {
            if (pData) {
                pData = JSON.parse(pData)
                console.log('====> pData', pData)
                if (!pData.errors || pData.errors.length === 0) {
                    return {sucesso: true, response: pData, erro: null, pipeId: config.pipeid}
                } else {
                    return {sucesso: false, response: pData, erro: 'A api requisitada retornou com erro.'}                
                }
            } else {
                return {sucesso: false, response: pData, erro: 'A api requisitada não retornou nenhuma resposta válida.'}
            }      
        }).catch((e) => {
            console.error(`#apiPipefy - Erro na na chamada ao Pipefy - erro:`, e)
            console.error(`#apiPipefy - request: `, options)
            return {sucesso: false, response: null, erro: e}
        })
    }
}

function montaQuery(data, config, usuario) {
    const queries = {
        criarCard: 'mutation{ createCard( input: { pipe_id: {{pipeId}} fields_attributes: [ {field_id: "tipo_solicita_o", field_value: ["{{tipoSolicitacao}}"]} {field_id: "matr_cula", field_value: "{{matricula}}"} {field_id: "cpf", field_value: "{{cpf}}"} {field_id: "e_mail_solicitante", field_value: "{{email}}"} {field_id: "plano", field_value: "{{plano}}"} {field_id: "dados_anteriores", field_value: "{{dadosAnteriores}}"} {field_id: "dados_atualizados", field_value: "{{dadosNovos}}"} {field_id: "origem", field_value: ["Portal"]} {field_id: "chave", field_value: "{{chave}}"} ] }) { card { id title }}}',
        consultarCard: '{ card(id: {{cardId}}) { title assignees { id } comments { text } comments_count current_phase { name } done due_date fields { name value } labels { name } phases_history { phase { name } firstTimeIn lastTimeOut } url } }',
        cancelarCard: 'mutation { n1: updateCardField( input: { card_id: {{cardId}} field_id: "analisado" new_value: "Cancelado a pedido do Participante" } ) {success} n2: updateCardField( input: { card_id: {{cardId}} field_id: "realizado_lan_amento_sistema_sinqia" new_value: "Não" } ) {success}  n3: moveCardToPhase( input: { card_id: {{cardId}} destination_phase_id: {{cancelamentoId}} } ) { card { id current_phase{ name } } } }'    
    }
//        cancelarCard: 'mutation { updateCardField( input: { card_id: {{cardId}} field_id: "analisado" new_value: "Cancelado a pedido do Participante" } ) { card { id } } updateCardField( input: { card_id: {{cardId}} field_id: "realizado_lan_amento_sistema_sinqia" new_value: "Não" } ) { card { id } }  moveCardToPhase( input: { card_id: {{cardId}} destination_phase_id: {{cancelamentoId}} } ) { card { id current_phase{ name } } } }'
    
    data.body['pipeId'] = config.pipeid
    data.body['cancelamentoId'] = config.cancelamentoid
    data.body['nome'] = usuario.nome ? usuario.nome : ''
    data.body['cpf'] = usuario.cpf ? usuario.cpf : ''
    data.body['email'] = usuario.email ? usuario.email : ''

    console.log('===> data.body', data.body)
    console.log('====> data.acao', data.acao)

    let query = queries[data.acao]
    console.log('===> query', query)
    Object.keys(data.body).forEach((key) => {
        if (data.body[key]) {
            let repKey = new RegExp(`{{${key}}}`, 'g') //regex para trocar todas as ocorrências da string
            query = query.replace(repKey, data.body[key]) //troca o conteudo das chaves
        }
    });
    return query

}
