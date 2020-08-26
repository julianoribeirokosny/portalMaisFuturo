'use strict';

import emprestimo from './emprestimo.html'
import './emprestimo.css'
import GraficoEmprestimo from './graficoEmprestimo'
import page from 'page'

const financeiro = require('../../../functions/Financeiro')

export default {
    template: emprestimo,
    components: {
        GraficoEmprestimo
    },
    props: {
       chave: '',
       uid: '',
    },
    data: function() {
        return {
           dadosEmprestimo: []
        }
    },
    created(){
        this.getEmprestimo()
    },
    mounted() {
        
    },
    watch: {
       
    },
    methods: {
        getEmprestimo(){
            this.dadosEmprestimo = {
                grafico:{
                    data: 75
                },
                tabela:[
                    {
                        name: "valor contratado",
                        value: 75000,
                        color: "color: green"
                    },
                    {
                        name: "valor parcela",
                        value: 3500,
                        color: "color: red"
                    }
                ],
                disponivel: 100,
            }
        },
        redirectSimuladorEmprestimo(){
            page("/simulador-emprestimo")
        },
        formatMoeda(value, incluiCifrao){
            if (value === 0) {
                return '(não contratado)'
            } else if (value && value !== 0) {
                let val = financeiro.valor_to_string_formatado(value, 2, incluiCifrao, true)
                return val
            }
        }
    },
}