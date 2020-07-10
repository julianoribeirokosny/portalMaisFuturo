'use strict';

import GraficoMinhaContribuicao from './graficoMinhaContribuicao'
import minhaContribuicao from './minhaContribuicao.html'
import './minhaContribuicao.css';

const financeiro = require('../../../functions/Financeiro')

export default {    
    template: minhaContribuicao,
    components: {
        GraficoMinhaContribuicao
    },
    props: {
       contribuicao: null
    },
    mounted() {
        let rowParticipante = document.querySelector('#div-contribuicao-row-participante')
        if (rowParticipante) {
            let paticipanteTotal = document.querySelector('#div-contribuicao-row-participante-total')
            if (paticipanteTotal) {
                paticipanteTotal.style.height = rowParticipante.clientHeight + "px"
            }
        }
        let rowPatronal = document.querySelector('#div-contribuicao-row-patronal')
        if (rowPatronal) {
            let patronalTotal = document.querySelector('#div-contribuicao-row-patronal-total')
            if (patronalTotal) {
                patronalTotal.style.height = rowPatronal.clientHeight + "px"
            }
        }
        let rowSeguro = document.querySelector('#div-contribuicao-row-seguro')
        if (rowSeguro) {
            let seguroTotal = document.querySelector('#div-contribuicao-row-seguro-total')
            if (seguroTotal) {
                seguroTotal.style.height = rowSeguro.clientHeight + "px"
            }
        }
    },
    methods: {
        formatMoeda(value, incluiCifrao){
            if (value === 0) {
                return '(não contratado)'
            } else if (value && value !== 0) {
                let val = financeiro.valor_to_string_formatado(value, 2, incluiCifrao, true)
                return val
            }
        }
    }
}