'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

require('./simulador.css');

export default {      
    template: require('./simulador.html'),
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
                    slider: {  
                        min: 12,
                        max: 60,
                        value: 24,
                        step: 1
                    },
                    quantidade: 20,
                    principal: 790000
                }
            }
        }
    },    
    data: function() {
        return {   
            formatter1: '{value} x',
            quantidade: 0,
            principal: 0,
            parcela: 0,
            money: {
                decimal: ',',
                thousands: '.',
                prefix: 'R$ ',
                //suffix: ' #',
                precision: 2,
                masked: false /* doesn't work with directive */
            },            
            sliderOptions: {
                dotSize: 14,
                width: 5,
                height: 400,
                contained: false,
                direction: 'btt',
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
                tooltipPlacement: 'left',
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
    created() {
        this.quantidade = this.dados.quantidade;
        this.principal = this.dados.principal;
        //this.calcularParcela();        
    },    
    watch: {    
        quantidade: function (newvalue, oldvalue) {            
            if(newvalue !== oldvalue)
                this.calcularParcela();
        },
        principal: function (newvalue, oldvalue) {
            if(newvalue !== oldvalue)
                this.calcularParcela();
        }
    },
    methods: {      
        calcularParcela(){
            this.principal = this.principal.toString().replace('R$','').replace('.','').replace(',','');                        
            this.parcela = ((parseFloat(this.principal/100)/this.quantidade)).toFixed(2).toString().replace(".",",");            
        }  
    },
}