'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

import vSelect from 'vue-select'; 
import 'vue-select/dist/vue-select.css';

import simuladorRenda from './simuladorRenda.html';
import './simuladorRenda.css';

import page from 'page';
import Contratacao from '../contratacao/contratacao';

const financeiro = require('../../../functions/Financeiro')

export default {    
    template: simuladorRenda,
    components: { 
        VueSlider, vSelect, Contratacao
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    usr_tipo_plano: 'instituido',
                    taxa_anual_simulacao: 5,
                    titulo: 'Defina sua</br>participaÇÃO </br> mensal',
                    minimoContribuicao: 100,
                    maximoContribuicao: 1000,
                    stepContribuicao: 10,
                    reservaTotalFutura: 200000,
                    rendaMensalFutura: 800,
                    idadeBeneficio: 65,
                    contribuicaoPatronal: 0
                }
            }
        }
    },    
    data: function() {
        return {
            contratacao: {
                titulo:'',
                msg_inicial:'',
                msg_vigencia:'',
                msg_novo_valor:'',
                valor_novo:'',
                valor_novo_Tela:'',
                valor_antigo:'',
                titulo_finalizacao:'',
                finalizacao_msg:'',
                finalizacao_msg_novo_valor:'',
                chave:'',
                uid:'',
                label_button:'',
                tipo: ''
            },
            lidades: [{ label: '45 anos', value: 45 },{ label: '46 anos', value: 46 },{ label: '47 anos', value: 47 },
                      { label: '48 anos', value: 48 },{ label: '49 anos', value: 49 },{ label: '50 anos', value: 50 },
                      { label: '51 anos', value: 51 },{ label: '52 anos', value: 52 },{ label: '53 anos', value: 53 },
                      { label: '54 anos', value: 54 },{ label: '55 anos', value: 55 },{ label: '56 anos', value: 56 },
                      { label: '57 anos', value: 57 },{ label: '58 anos', value: 58 },{ label: '59 anos', value: 59 },
                      { label: '60 anos', value: 60 },{ label: '61 anos', value: 61 },{ label: '62 anos', value: 62 },
                      { label: '63 anos', value: 63 },{ label: '64 anos', value: 64 },{ label: '65 anos', value: 65 },
                      { label: '66 anos', value: 66 },{ label: '67 anos', value: 67 },{ label: '68 anos', value: 68 },
                      { label: '69 anos', value: 69 },{ label: '70 anos', value: 70 }],            
            contribuicao: this.dados.minimoContribuicao,
            formatter1: v => `${('' + v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
            contribuicaoTela: '',
            reservaTotalTela: '',
            reservaTotal: 0,            
            rendaMensalTela: '',
            rendaMensal: 0,
            contribuicaoFixaTela: '',            
            contribuicaoTotalTela: '',
            qtd_meses: 0,
            idade: this.dados.idadeBeneficio,            
            tempo: 15,
            ltempo: [
                { label: '10 anos', value: 10 },                
                { label: '11 anos', value: 11 },
                { label: '12 anos', value: 12 },
                { label: '13 anos', value: 13 },
                { label: '14 anos', value: 14 },
                { label: '15 anos', value: 15 },
                { label: '16 anos', value: 16 },
                { label: '17 anos', value: 17 },
                { label: '18 anos', value: 18 },
                { label: '19 anos', value: 19 },
                { label: '20 anos', value: 20 },
                { label: '21 anos', value: 21 },
                { label: '22 anos', value: 22 },
                { label: '23 anos', value: 23 },
                { label: '24 anos', value: 24 },
                { label: '25 anos', value: 25 },
                { label: '26 anos', value: 26 },
                { label: '27 anos', value: 27 },
                { label: '28 anos', value: 28 },
                { label: '29 anos', value: 29 },
                { label: '30 anos', value: 30 }],
            simulador: true,
            taxa_mensal: 0,     
            date_now: '',
            date_inicio_renda: '',
            sliderContribuicao: {
                dotSize: 14,
                height: 360,
                with: 15,
                direction: 'btt',
                contained: false,
                data: null,
                min: this.dados.minimoContribuicao,
                max: this.dados.maximoContribuicao,
                interval: this.dados.stepContribuicao,
                disabled: false,
                clickable: true,
                duration: 0.5,
                adsorb: false,
                lazy: false,
                tooltip: 'always',
                tooltipPlacement: 'top',
                tooltipFormatter: void 0,
                useKeyboard: false,
                keydownHook: null,
                dragOnClick: false,
                enableCross: true,
                fixed: false,
                minRange: void 0,
                maxRange: void 0,
                order: true,
                marks: false,
                dotOptions: void 0,
                process: true,                
                railStyle: void 0,                                
                stepStyle: void 0,
                stepActiveStyle: void 0,
                labelStyle: void 0,
                labelActiveStyle: void 0,
                processStyle: {
                    "backgroundColor": "#0C7BC6"
                },
                tooltipStyle: {
                    "font-size":"9px",
                    "margin":"1px",
                    "backgroundColor": "#0C7BC6",
                    "border-radius": "50%",
                    "border-color": "#0C7BC6",
                    "display": "inline"
                },
                dotStyle: {
                    "backgroundColor": "#0C7BC6",
                    "border-color": "#0C7BC6"
                },
            }
        }
    },
    created(){        
        this.date_inicio_renda = financeiro.calculaDataInicioRenda(this.dados.usr_dtnasc, this.idade)
        this.contribuicaoTela = financeiro.valor_to_string_formatado(this.dados.minimoContribuicao.toFixed(2), 2, false, true)
        this.reservaTotalTela = financeiro.valor_to_string_formatado(this.dados.reservaTotalFutura, 2, false, true)
        this.rendaMensalTela = financeiro.valor_to_string_formatado(this.dados.rendaMensalFutura, 2, false, true)
        this.contribuicaoFixaTela = financeiro.valor_to_string_formatado(this.dados.contribuicaoFixa.toFixed(2), 2, false, true)
        this.contribuicaoTotalTela = financeiro.valor_to_string_formatado((this.dados.minimoContribuicao + this.dados.contribuicaoFixa).toFixed(2), 2, false, true)
    }, 
    mounted(){
    },
    watch: {
        contribuicao(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.contribuicaoTela = financeiro.valor_to_string_formatado(newVal.toFixed(2), 2, false, true)
                this.contribuicaoTotalTela = financeiro.valor_to_string_formatado((newVal + this.dados.contribuicaoFixa).toFixed(2), 2, false, true)
                this.calculaReservaFutura()
                this.calculaRendaFutura()
            }
        },
        idade(newVal, oldVal) {
            if(newVal !== oldVal) {
                //this.date_inicio_renda = new Date(Number(this.date_parts[2]) + Number(newVal), this.date_parts[1] - 1, this.date_parts[0])
                this.date_inicio_renda = financeiro.calculaDataInicioRenda(this.dados.usr_dtnasc, this.idade)
                this.calculaReservaFutura()
                this.calculaRendaFutura()
            }
        },
        tempo(newVal, oldVal){
            if(newVal !== oldVal) {                
                this.calculaRendaFutura()
            }
        }
    },
    methods: {
        cancelarContratacao(value) {
            this.simulador = value
        },
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        continuar(link) {
            page(`/${link}`)
        },
        contratar() {
            var d = new Date()
            var month = new Array()
            month[0] = "Jan"
            month[1] = "Fev"
            month[2] = "Mar"
            month[3] = "Abr"
            month[4] = "Mai"
            month[5] = "Jun"
            month[6] = "Jul"
            month[7] = "Ago"
            month[8] = "Set"
            month[9] = "Out"
            month[10] = "Nov"
            month[11] = "Dez"
            var n = month[d.getMonth() + 1]
            this.contratacao.titulo = 'Confirme a </br> alteração da </br>sua contribuição'
            this.contratacao.msg_inicial = 'Você está alterando o valor da sua contribuição mensal.'
            this.contratacao.msg_vigencia = `A sua nova contribuição mensal estará vigente a partir do mês de ${n}/${d.getFullYear()}.`
            this.contratacao.msg_novo_valor = `O valor da sua nova contribuição mensal é de R$ ${this.contribuicaoTela}.`
            this.contratacao.valor_novo = this.contribuicao
            this.contratacao.valor_novo_Tela = this.contribuicaoTela
            this.contratacao.valor_antigo = this.dados.minimoContribuicao
            this.contratacao.titulo_finalizacao = 'Parabéns!!! </br> Sua contribuição </br> foi alterada'
            this.contratacao.finalizacao_msg = 'Contribuição mensal alterada com sucesso.'
            this.contratacao.finalizacao_msg_novo_valor = 'Você receberá o boleto com o novo valor de R$ '
            this.contratacao.chave = this.dados.chave
            this.contratacao.uid =  this.dados.uid
            this.contratacao.label_button = 'Confirma novo valor'
            this.contratacao.tipo = 'Contribuição mensal'
            //console.log('Contratacao',this.contratacao)
            this.simulador = false
        },
        calculaReservaFutura() {
            this.reservaTotal = financeiro.calculaReservaFutura(
                this.dados.reservaTotalAtual, 
                this.dados.taxa_anual_simulacao, 
                this.contribuicao,
                this.dados.contribuicaoFixa,
                this.dados.contribuicaoPatronal,
                this.date_inicio_renda,
                this.dados.usr_tipo_plano
            )

            this.reservaTotalTela = financeiro.valor_to_string_formatado(this.reservaTotal, 2, false, true)
        },
        calculaRendaFutura() {
            this.rendaMensalTela = financeiro.valor_to_string_formatado(
                financeiro.calculaRendaFutura(
                    this.reservaTotal,
                    this.dados.taxa_anual_simulacao,
                    this.tempo,
                    this.dados.usr_tipo_plano
                ), 
                2, false, true
            )
        },
    },
}