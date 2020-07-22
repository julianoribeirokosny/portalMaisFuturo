'use strict';

import servicos from './servicos.html'
import './servicos.css'
import page from 'page'

const icon_view = require('../../../public/images/View-Icons.png')
const icon_list = require('../../../public/images/ViewList.png')
const icon_segunda_via_boleto = require('../../../public/images/SegundaViaBoleto-IconS.png')
const icon_segunda_via_ir = require('../../../public/images/SegundaViaIR-IconS.png')
const icon_extrato_contribuicoes = require('../../../public/images/ExtratoContribuicoes-IconS.png')
const icon_simulador_contribuicoes = require('../../../public/images/SimuladorContribuicoes-IconS.png')
const icon_simulador_emprestimos = require('../../../public/images/SimuladorEmprestimos-IconS.png')
const icon_simulador_riscos = require('../../../public/images/SimuladorRiscos-IconS.png')
const icon_historico_servicos = require('../../../public/images/HistoricoServicos-IconS.png')

export default {
    template: servicos,
    data: function() {
        return {
            displayIcon: false,
            icon_list: icon_list,
            icon_view: icon_view,
            icon_segunda_via_boleto: icon_segunda_via_boleto,
            icon_segunda_via_ir: icon_segunda_via_ir,
            icon_extrato_contribuicoes: icon_extrato_contribuicoes,
            icon_simulador_contribuicoes: icon_simulador_contribuicoes,
            icon_simulador_emprestimos: icon_simulador_emprestimos,
            icon_simulador_riscos: icon_simulador_riscos,
            icon_historico_servicos: icon_historico_servicos,
            orientacao: 0
        }
    },
    mounted() {
        window.addEventListener('orientationchange', function() {
            this.orientacao = screen.orientation.angle
        });
    },
    watch: {
        orientacao(newVal, oldVal) {
            if (newVal === 0) {
                this.displayIcon = false
            } else {
                this.displayIcon = true
            }
        }
    },
    methods: {
        toggledisplayList() {
            this.displayIcon = false
        },
        toggledisplayIcon() {
            this.displayIcon = true
        },
        clickPage(link, anchor) {
            sessionStorage.ultimaPagina = 'servicos'
            anchor = anchor ? anchor : ''
            page(`/${link}#${anchor}`)
        }
    },
}