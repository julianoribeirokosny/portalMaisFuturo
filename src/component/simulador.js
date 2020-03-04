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
                        step: 1
                    },
                    quantidade: 36,
                    principal: 8400,
                    maximo: 8500,
                }
            }
        }
    },    
    data: function() {
        return {   
            formatter1: '{value} x',
            quantidade: this.dados.quantidade,
            principal: this.dados.principal,   
            maximo: this.dados.maximo, 
            validacao: false,  
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
    methods: {      
        calcularParcela(){    
            if(parseFloat(this.principal.toString().replace(/\./g,'')) > this.maximo) {
                this.validacao = true;
                //this.$refs.botao.disabled('disabled');
                console.log('botao',this.$refs.botao);

            } else {
                //this.$refs.botao.remove('disabled');
                this.validacao = false;
                this.parcela = this.thousands_separators((parseFloat(this.principal.toString().replace(/\./g,''))/this.quantidade).toFixed(2));
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
        }
    },
}