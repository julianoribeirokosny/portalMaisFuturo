'use strict';

import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/antd.css';
import simuladorRenda from './simuladorRenda.html';
import './simuladorRenda.css';
import page from 'page';
import vSelect from 'vue-select'; 
import 'vue-select/dist/vue-select.css';
import financeiro from '../../../functions/Financeiro';

export default {    
    template: simuladorRenda,
    components: { 
        VueSlider, vSelect
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    tipoPlano: 'instituido',
                    titulo: 'Defina sua</br>participação </br> mensal',
                    minimoContribuicao: 100,
                    maximoContribuicao: 1000,
                    stepContribuicao: 10,
                    reservaTotalFutura: 200000,
                    rendaMensalFutura: 800,
                    idadeBeneficio: 65
                }
            }
        }
    },    
    data: function() {
        return {                           
            contribuicao: this.dados.minimoContribuicao,
            contribuicaoTela: this.thousands_separators(this.dados.minimoContribuicao),
            formatter1: v => `${('' + v).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
            reservaTotalTela: this.thousands_separators(this.dados.reservaTotalFutura),
            rendaMensalTela: this.thousands_separators(this.dados.rendaMensalFutura),
            idade: this.dados.idadeBeneficio,
            lidades: ['45','46','47','48','49','50','51','52','53','54','55','56','57','58','59','60','61','62','63','64','65','66','67','68','69','70','71','72','73','74','75'],
            toggle: false,
            taxa_mensal: 0,            
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
        console.log('this.dados',this.dados);
        this.calculaPremioInvalidez()
        // this.coberturaTelaInvalidez = this.thousands_separators(this.coberturaInvalidez)
        // this.premioTelaInvalidez = this.thousands_separators(this.premioInvalidez)
        // this.calculaPremioMorte()
        // this.coberturaTelaMorte = this.thousands_separators(this.coberturaMorte)
        // this.premioTelaMorte = this.thousands_separators(this.premioMorte)
        // this.calculaTotal()
    }, 
    mounted(){
    },
    watch: {
        contribuicao(newVal, oldVal) {
             if(newVal !== oldVal) {                 
                 this.contribuicaoTela = this.thousands_separators(newVal)                 
             }
        },
        // coberturaMorte(newVal, oldVal) {
        //     if(newVal !== oldVal) {
        //         this.calculaPremioMorte()
        //         this.coberturaTelaMorte = this.thousands_separators(newVal)
        //         this.premioTelaMorte = this.thousands_separators(this.premioMorte)
        //         this.calculaTotal()
        //     }
        // }
    },
    methods: {        
        thousands_separators(num) {
            let numero = String(num).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
            return numero
        },
        continuar(link) {
            page(`/${link}`)
        },
        contratar() {
            let ipagto = new financeiro()            
            var pgto = ipagto.pgto(5000, 1, 10)
            console.log('pgto', pgto)

            var vf = ipagto.valorFuturo(10000, 1, 10, 150)
            console.log('valorFuturo', vf)

            var pv = ipagto.valorPresente(100, 3.5, 12)
            console.log('valorPresente', pv)

            var strpgto = ipagto.float_to_string(pgto)
            var strvp = ipagto.float_to_string(vf)
            var strpv = ipagto.float_to_string(pv)

            console.log('strpgto', strpgto)            
            console.log('strvp', strvp)            
            console.log('strpv', strpv)
        },
        selectAll() {
            this.$refs.idade.select();
        }
    },
}