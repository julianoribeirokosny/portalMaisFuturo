'use strict'

export const contratacao = {
    RENDA: 'Contribuição mensal',
    SEGURO: 'Seguro',
    EMPRESTIMO: 'Empréstimo'
}

export const statusContratacao = {
    SOLICITADO: 'solicitado'
}

export const perfilInvestimento = {
    CONSERVADOR: 'Conservador',
    MODERADO: 'Moderado',
    AGRESSIVO: 'Agressivo'
}

export const disclaimer = {
    EMPRESTIMO: '<p>Os valores apresentados são apenas estimativas e não garantem nenhum direito à concessão de qualquer crédito ao interessado pelo Fundo de Previdência Mais Futuro, estando a efetiva concessão sujeita à confirmação do preenchimento dos pré-requisitos necessários estabelecidos em legislação, políticas, regulamentos e no instrumento contratual aplicáveis, bem como à disponibilidade de recursos garantidores no referido segmento de aplicação.</p>',
    RENDA: '<p>1. Os valores apresentados são apenas estimativas e não garantem nenhum direito ao participante. O direito efetivo dependerá dos dados reais na data da efetiva concessão do benefício de aposentadoria ou resgate.</p><p>2. O valor projetado do benefício foi calculado com base no saldo atual acrescido das contribuições e rentabilidade do período até a data da aposentadoria ou resgate, de acordo com a opção de renda ou recebimento.</p><p>3. O valor do benefício bruto projetado não considera o desconto de eventuais impostos e taxas administrativas.</p><p><b>Consulte o Regulamento do seu Plano de Benefícios para maiores informações.</p>',
    SEGURO: '<p>1. Os valores apresentados são apenas estimativas e não garantem nenhum direito ao participante. O direito efetivo à cobertura contratada dependerá das disposições do contrato celebrado junto à Sociedade Seguradora contratada quando da ocorrência de sinistro e concessão.</p><p>2. A aceitação do risco estará sujeita à análise por parte da Sociedade Seguradora parceira, bem como, o pagamento da renda por invalidez ou pensão por morte está condicionado às regras da Sociedade Seguradora parceira.</p><p><b>Consulte o Regulamento do seu Plano de Benefícios para informações sobre reajuste de prêmios e/ou capitais segurados.</p>'
}

export const limite = {
    EMPRESTIMO: 469000
}

export const tiposSolicitacaoPipefy = {
    "Seguro": "Contratação de Risco",
    "Seguro - Cancelamento": "Cancelamento de Risco",
    "Contribuição mensal": "Alteração de Contribuição",
    //renda1: "Suspensão de Contribuição",
    cadastro: "Alteração de Cadastro",
    boleto: "Segunda-via de Boletos",
    "Empréstimo": "Solicitação de Empréstimo"
}


export default class Enum {
    
}
