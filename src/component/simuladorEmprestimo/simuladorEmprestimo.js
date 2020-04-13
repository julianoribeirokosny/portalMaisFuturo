'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

import simuladorEmprestimo from './simuladorEmprestimo.html';
import './simuladorEmprestimo.css';

export default {
    template: simuladorEmprestimo,
    components: { 
        VueSlider
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    titulo: "Simulador </br>de Empréstimo",
                    descricao: "Você tem até R$ 8.500,00 </br>pré aprovado.",                     
                    quantidade: 36,
                    principal: 840000,
                    maximo: 850000,
                    taxa_adm: 5.14,
                    taxa_mensal: 0.8,
                    indice_anterior: 0.19,                    
                }
            }
        }
    },    
    data: function() {
        return {   
            taxa_mensal: 0,
            formatter1: '{value} x',
            quantidade: this.dados.quantidade,
            principal: this.dados.principal,   
            maximo: this.dados.maximo, 
            valido: true,
            parcela: 0,
            money: {
                decimal: '',
                thousands: '.',
                prefix: '',
                suffix: ' ',
                precision: 0,
                masked: false /* doesn't work with directive */
            },            
            sliderOptions: {
                dotSize: 14,                
                height: 10,
                contained: false,                
                data: null,
                min: 12,
                max: 60,
                interval: 1,
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
        //this.$refs.botao.style.backgroundColor = '#dfe5eb';
    },
    mounted(){
        this.calcula_taxa_mensal();
    },
    methods: {      
        calcularParcela(){    
            if(parseFloat(this.principal.toString().replace(/\./g,'')) > this.maximo) {
                this.valido = false;                
                //this.$refs.botao.style.backgroundColor = '#dfe5eb';                
                this.parcela = '0';
            } else {
                //this.$refs.botao.style.backgroundColor = '#0C7BC6';
                this.valido = true;
                this.PGTO();
                //this.parcela = this.thousands_separators((parseFloat(this.principal.toString().replace(/\./g,''))/this.quantidade).toFixed(2));
            }
        },
        alteraPrincipal(){
            this.calcularParcela();
        },
        thousands_separators(num) {
            var num_parts = num.toString().split(".");
            num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            return num_parts.join(",");
        },
        selectAll() {
            this.$refs.inputprincipal.select();
        },
        contratarEmprestimo(){
            if(this.valido) {
                alert("Redirect Contratar " + this.principal.toString() + " " + this.quantidade.toString() + "x de " + this.parcela.toString());
            }            
        },
        calcula_taxa_mensal() {  
            const data_liberacao = new Date();
            const inicio = new Date(data_liberacao.getFullYear(), data_liberacao.getMonth(), 1);
            const diferenca = Math.abs(data_liberacao.getTime() - inicio.getTime());
            const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24)) - 1;
            this.taxa_mensal = ((1 + this.dados.taxa_mensal/100) * (Math.pow(1 + (this.dados.indice_anterior/100), (dias / 30))) - 1) * 100;
        },
        PGTO() {
            this.parcela =  this.thousands_separators((parseFloat(this.principal.toString().replace(/\./g,'')) *  (this.taxa_mensal/100) * Math.pow(1 + (this.taxa_mensal/100), this.quantidade) / (Math.pow(1 + (this.taxa_mensal/100), this.quantidade) - 1 )).toFixed(2));
        }
    },
}