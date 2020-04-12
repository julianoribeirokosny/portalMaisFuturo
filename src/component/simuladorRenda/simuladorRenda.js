'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';
import simuladorRenda from './simuladorRenda.html';
import './simuladorRenda.css';
import page from 'page';
import vSelect from 'vue-select'; 
import 'vue-select/dist/vue-select.css';
import financeiro from '../../../functions/Financeiro';
import contratacao from '../contratacao/contratacao'

export default {    
    template: simuladorRenda,
    components: { 
        VueSlider, vSelect, contratacao
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    usr_tipo_plano: 'instituido',
                    taxa_anual_simulacao: 5,
                    titulo: 'Defina sua</br>participação </br> mensal',
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
                titulo: 'Confirme a </br> alteração da </br>sua contribuição',
                mensagem: 'Mensagem de teste',
                valor: '3.012,54'
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
            ipagto: new financeiro(),
            contribuicao: this.dados.minimoContribuicao,
            formatter1: v => `${('' + v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
            contribuicaoTela: '',
            reservaTotalTela: '',
            reservaTotal: 0,            
            rendaMensalTela: '',
            rendaMensal: 0,
            contribuicaoFixaTela: '',            
            contribuicaoTotalTela: '',
            taxa_mensal_simulador: Math.pow(this.dados.taxa_anual_simulacao/100+1, 1/12)-1,
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
            date_parts: this.dados.usr_dtnasc.split('/'),
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
        this.date_now = new Date()
        this.date_inicio_renda = new Date(Number(this.date_parts[2]) + Number(this.idade), this.date_parts[1] - 1, this.date_parts[0])
        this.contribuicaoTela = this.ipagto.float_to_string(this.dados.minimoContribuicao.toFixed(2))
        this.reservaTotalTela = this.ipagto.float_to_string(this.dados.reservaTotalFutura)
        this.rendaMensalTela = this.ipagto.float_to_string(this.dados.rendaMensalFutura)
        this.contribuicaoFixaTela = this.ipagto.float_to_string(this.dados.contribuicaoFixa.toFixed(2))
        this.contribuicaoTotalTela = this.ipagto.float_to_string((this.dados.minimoContribuicao + this.dados.contribuicaoFixa).toFixed(2))
    }, 
    mounted(){
    },
    watch: {
        contribuicao(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.contribuicaoTela = this.ipagto.float_to_string(newVal.toFixed(2))
                this.contribuicaoTotalTela = this.ipagto.float_to_string((newVal + this.dados.contribuicaoFixa).toFixed(2))
                this.calculaReservaFutura()
                this.calculaRendaFutura()
            }
        },
        idade(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.date_inicio_renda = new Date(Number(this.date_parts[2]) + Number(newVal), this.date_parts[1] - 1, this.date_parts[0])
                this.calculaQuantidadeMeses()
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
        continuar(link) {
            page(`/${link}`)
        },
        contratar() {            
            //this.simulador = false
            console.log('this.simulador',this.simulador)
            console.log('this.contratacao',this.contratacao)
        },
        calculaReservaFutura() {
            this.calculaQuantidadeMeses()
            this.reservaTotal = this.ipagto.valorFuturo(this.dados.reservaTotalAtual,
                                                        this.taxa_mensal_simulador, 
                                                        this.qtd_meses,
                                                        (this.contribuicao + this.dados.contribuicaoFixa + this.dados.contribuicaoPatronal).toFixed(2))
            
            if(this.dados.usr_tipo_plano == 'jmalucelli') {
                let decimoTerceiro = this.ipagto.valorFuturo(0, 5, this.qtd_meses/12, (this.dados.contribuicaoFixa + this.dados.contribuicaoPatronal).toFixed(2))
                console.log('decimoTerceiro',decimoTerceiro)
                console.log('this.reservaTotal antes',this.reservaTotal)
                this.reservaTotal += decimoTerceiro
                console.log('this.reservaTotal depois',this.reservaTotal)
            }
                                                        
            this.reservaTotalTela = this.ipagto.float_to_string(this.reservaTotal.toFixed(2))
        },
        calculaRendaFutura() {
            this.rendaMensal = this.ipagto.pgto(this.reservaTotal, this.taxa_mensal_simulador, (this.tempo*12))            
            this.rendaMensalTela = this.ipagto.float_to_string(this.rendaMensal)
        },
        calculaQuantidadeMeses() {
            this.qtd_meses = (this.date_inicio_renda.getFullYear() - this.date_now.getFullYear()) * 12;
            this.qtd_meses -= this.date_now.getMonth();
            this.qtd_meses += this.date_inicio_renda.getMonth();
            this.qtd_meses <= 0 ? 0 : this.qtd_meses;
        }
    },
}