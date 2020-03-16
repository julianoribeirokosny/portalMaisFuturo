'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';

import simuladorSeguro from './simuladorSeguro.html';
import './simuladorSeguro.css';

export default {
    template: simuladorSeguro,
    components: { 
        VueSlider
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    titulo: 'Simulador </br>Seguro de </br>',
                    tipo: 'Renda',
                    coberturaInvalidez: 150000,
                    minimoInvalidez: 15000,
                    maximoInvalidez: 1500000,
                    fatorInvalidez: 1.0163,
                    stepInvalidez: 15000,                    
                    coberturaMorte: 200000,
                    minimoMorte: 10000,
                    maximoMorte: 1500000,
                    fatorMorte: 1.1423,
                    stepMorte: 10000,
                }
            }
        }
    },    
    data: function() {
        return {   
            toggle: false,
            taxa_mensal: 0,
            formatter1: v => `${('' + v/1000).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
            coberturaTotal: 0,
            coberturaTelaTotal: '0',
            premioTotal: 0,
            premioTelaTotal: '0',
            corInvalidez: '#fc955b',
            coberturaInvalidez: this.dados.coberturaInvalidez,
            coberturaTelaInvalidez: '0',
            premioInvalidez: 0,
            premioTelaInvalidez: '0',
            corMorte: '#8BCF7B',
            coberturaMorte: this.dados.coberturaMorte,
            coberturaTelaMorte: '0',
            premioMorte: 0,
            premioTelaMorte: '0',
            money: {
                decimal: '',
                thousands: '.',
                prefix: '',
                suffix: ' ',
                precision: 0,
                masked: false /* doesn't work with directive */
            },            
            sliderInvalidez: {
                dotSize: 14,
                height: 380,
                with: 15,
                direction: 'btt',
                contained: false,
                data: null,
                min: this.dados.minimoInvalidez,
                max: this.dados.maximoInvalidez,
                interval: this.dados.stepInvalidez,
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
                    "backgroundColor": "#8BCF7B"
                },
                tooltipStyle: {
                    "font-size":"9px",
                    "margin":"1px",
                    "backgroundColor": "#8BCF7B",
                    "border-radius": "50%",
                    "border-color": "#8BCF7B",
                    "display": "inline"
                },
                dotStyle: {
                    "backgroundColor": "#8BCF7B",
                    "border-color": "#8BCF7B"
                },
            },
            sliderMorte: {
                dotSize: 14,
                height: 380,
                with: 15,
                direction: 'btt',
                contained: false,
                data: null,
                min: this.dados.minimoMorte,
                max: this.dados.maximoMorte,
                interval: this.dados.stepMorte,
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
                    "backgroundColor": "#003366"
                },
                tooltipStyle: {
                    "font-size":"9px",
                    "margin":"1px",
                    "backgroundColor": "#003366",
                    "border-radius": "50%",
                    "border-color": "#003366",
                    "display": "inline"
                },
                dotStyle: {
                    "backgroundColor": "#003366",
                    "border-color": "#003366"
                },
            }
        }
    },
    created(){
        this.calculaPremioInvalidez()
        this.coberturaTelaInvalidez = this.thousands_separators(this.coberturaInvalidez)
        this.premioTelaInvalidez = this.thousands_separators(this.premioInvalidez)
        this.calculaPremioMorte()
        this.coberturaTelaMorte = this.thousands_separators(this.coberturaMorte)
        this.premioTelaMorte = this.thousands_separators(this.premioMorte)
        this.calculaTotal()
    }, 
    mounted(){
    },
    watch: {
        coberturaInvalidez(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioInvalidez()
                this.coberturaTelaInvalidez = this.thousands_separators(newVal)
                this.premioTelaInvalidez = this.thousands_separators(this.premioInvalidez)
                this.calculaTotal()
            }
        },
        coberturaMorte(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioMorte()
                this.coberturaTelaMorte = this.thousands_separators(newVal)
                this.premioTelaMorte = this.thousands_separators(this.premioMorte)
                this.calculaTotal()
            }
        }
    },
    methods: {
        calculaTotal(){
            let premio = parseFloat(this.premioInvalidez) + parseFloat(this.premioMorte)
            this.premioTelaTotal = this.thousands_separators(premio)
            let cobertura = parseFloat(this.coberturaInvalidez) + parseFloat(this.coberturaMorte)
            this.coberturaTelaTotal = this.thousands_separators(cobertura)
        },
        calculaPremioInvalidez(){
            this.premioInvalidez = (this.coberturaInvalidez * this.dados.fatorInvalidez / 1000).toFixed(0)
        },
        calculaPremioMorte(){
            this.premioMorte = (this.coberturaMorte * this.dados.fatorMorte / 1000).toFixed(0)
        },
        thousands_separators(num) {
            console.log('Num',num)
            let numero = String(num).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
            console.log('Numero',numero)            
            return numero
        },
        toggleCategory(){
            this.toggle = !this.toggle;
        }
    },
}