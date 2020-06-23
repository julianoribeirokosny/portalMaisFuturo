'use strict';

//import Vue from 'vue/dist/vue.esm.js'
import vSelect from 'vue-select'
import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import page from 'page'
import simuladorSeguro from './simuladorSeguro.html'
import './simuladorSeguro.css'
import Contratacao from '../contratacao/contratacao'
import ContratacaoAberta from '../contratacaoAberta/contratacaoAberta'
import FirebaseHelper from '../../FirebaseHelper'

const img_editar = require('../../../public/images/Editar.png')
const financeiro = require('../../../functions/Financeiro')

export default {    
    template: simuladorSeguro,
    components: { 
        VueSlider, Contratacao, ContratacaoAberta, vSelect
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {                    
                    tipo: 'Seguro'                    
                }
            }
        }
    },    
    data: function() {
        return {
            dataSimulador: null,
            firebaseHelper: new FirebaseHelper(),
            maximoSemDpsInvalidez: 0,
            maximoSemDpsMorte:0,
            img_editar: img_editar,
            premioInicio: '',
            simulador: true,
            seguroSolicitado: false,
            toggle: false,
            taxa_mensal: 0,
            formatter1: v => `${('' + v/1000).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`,
            coberturaTotal: 0,
            coberturaTelaTotal: '0',
            premioTotal: 0,
            premioTelaTotal: '0',
            corInvalidez: '#fc955b',
            coberturaInvalidez: 0,
            coberturaTelaInvalidez: '0',
            premioInvalidez: 0,
            premioTelaInvalidez: '0',
            maximoSemDpsInvalidezTela: '0',
            corMorte: '#8BCF7B',
            coberturaMorte: 0,
            coberturaTelaMorte: '0',
            maximoSemDpsMorteTela: '0',
            premioMorte: 0,
            premioTelaMorte: '0',
            // money: {
            //     decimal: '',
            //     thousands: '.',
            //     prefix: '',
            //     suffix: ' ',
            //     precision: 0,
            //     masked: false /* doesn't work with directive */
            // },            
            sliderInvalidez: {
                dotSize: 14,
                height: 380,
                with: 15,
                direction: 'btt',
                contained: false,
                data: null,
                min: 0,
                max: 0,
                interval: 0,
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
                railStyle: {
                    "backgroundColor": "#d3cbcb",
                    "width": "8px",
                    "border-radius": "4px"
                },
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
                min: 0,
                max: 0,
                interval: 0,
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
                railStyle: {
                    "backgroundColor": "#d3cbcb",
                    "width": "8px",
                    "border-radius": "4px"
                },          
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
            },
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
            profissao: null,
            profissoes: [],
            listaProfissoes: [],
            cadastro: {profissao: null}
        }
    },
    created(){        
        console.log('T H I S  D A D O S  S E G U R O S:',this.dados)
        this.dataSimulador = this.dados      
        if(this.dados.seguroSolicitado.dados != null) {
            this.seguroSolicitado = true
        } else {
            this.getProfissaoParticipante(this.dados.chave)  
            this.montarDados(this.dataSimulador)
            // this.getProfissaoParticipante(this.dados.chave)
            // this.maximoSemDpsInvalidezTela = this.valor_to_string_formatado(this.dados.maximoSemDpsInvalidez)
            // this.maximoSemDpsMorteTela = this.valor_to_string_formatado(this.dados.maximoSemDpsMorte)
            // this.calculaPremioInvalidez()            
            // this.coberturaTelaInvalidez = this.valor_to_string_formatado(this.coberturaInvalidez)
            // this.premioTelaInvalidez = this.valor_to_string_formatado(this.premioInvalidez)
            // this.calculaPremioMorte()            
            // this.coberturaTelaMorte = this.valor_to_string_formatado(this.coberturaMorte)
            // this.premioTelaMorte = this.valor_to_string_formatado(this.premioMorte)
            // this.calculaTotal()
            // this.premioInicio = parseInt(this.premioInvalidez) + parseInt(this.premioMorte)
        }
              
    },
    mounted(){
        this.$root.$on('nova::Profissao', () => {
            this.consultaDados()
            // this.sliderMorte.max = profissao.seguro
            // this.sliderInvalidez.max = profissao.seguro
            this.closeModal()
        })  
        if (this.dados.bloqueio) {
            this.$refs.ModalBloqueioIdade.style.display = "block"
            // let modal = document.getElementById('ModalBloqueioIdade')
            // modal.style.display = "block"
        }
    },
    watch: {
        coberturaInvalidez(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioInvalidez()
                console.log('==> this.premioInvalidez', this.premioInvalidez)
                this.coberturaTelaInvalidez = this.valor_to_string_formatado(newVal)
                this.premioTelaInvalidez = this.valor_to_string_formatado(this.premioInvalidez)
                this.calculaTotal()
            }
        },
        coberturaMorte(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioMorte()
                console.log('==> this.premioMorte', this.premioMorte)
                this.coberturaTelaMorte = this.valor_to_string_formatado(newVal)
                this.premioTelaMorte = this.valor_to_string_formatado(this.premioMorte)
                this.calculaTotal()
            }
        },
        profissao(newVal){
            if(newVal) {
                this.$refs.salvar.style.pointerEvents = 'visible'
                this.$refs.salvar.style.opacity = 1
            } else {
                this.$refs.salvar.style.pointerEvents = 'none'
                this.$refs.salvar.style.opacity = 0.6
            }
        }
    },
    methods: {
        consultaDados() {    

            // let promise = new Promise((resolve) => {
            //         this.firebaseHelper.getDadosSimuladorSeguro(this.dados.chave, this.dados.uid).then((ret) => {
            //             resolve(ret)
            //             //return ret 
            //     })
            // })

            let dados2 = {
                bloqueio: false,
                chave: "4-1817",
                fatorInvalidez: 0.11,
                maximoInvalidez: 1093622,
                maximoSemDpsInvalidez: 143622,
                minimoInvalidez: 103622,
                coberturaInvalidez: 103622,
                stepInvalidez: 10000,
                fatorMorte: 0.281,
                maximoMorte: 152536,
                maximoSemDpsMorte: 102536,
                minimoMorte: 72536,
                coberturaMorte: 72536,
                stepMorte: 10000,
                tipo: "Seguro",
                titulo: "Simulador de</br>Seguro de Renda",
                uid: "94mh0zeGzBc50xo93ub5DJluxpc2"
            }
            console.log('C O N S U L T A  D A D O S  S I M U L A D O R  S E G U R O',dados2) 
            this.montarDados(dados2)
        },
        montarDados(dataSimulador) {
            this.maximoSemDpsInvalidez =  dataSimulador.maximoSemDpsInvalidez
            this.maximoSemDpsMorte = dataSimulador.maximoSemDpsMorte
            this.coberturaInvalidez = dataSimulador.coberturaInvalidez
            this.coberturaMorte = dataSimulador.coberturaMorte
            this.sliderInvalidez.min = dataSimulador.minimoInvalidez
            this.sliderInvalidez.max = dataSimulador.maximoInvalidez
            this.sliderInvalidez.interval = dataSimulador.stepInvalidez
            this.sliderMorte.min = dataSimulador.minimoMorte
            this.sliderMorte.max = dataSimulador.maximoMorte
            this.sliderMorte.interval = dataSimulador.stepMorte
            this.maximoSemDpsInvalidezTela = this.valor_to_string_formatado(dataSimulador.maximoSemDpsInvalidez)
            this.maximoSemDpsMorteTela = this.valor_to_string_formatado(dataSimulador.maximoSemDpsMorte)
            this.calculaPremioInvalidez()            
            this.coberturaTelaInvalidez = this.valor_to_string_formatado(this.coberturaInvalidez)
            this.premioTelaInvalidez = this.valor_to_string_formatado(this.premioInvalidez)
            this.calculaPremioMorte()            
            this.coberturaTelaMorte = this.valor_to_string_formatado(this.coberturaMorte)
            this.premioTelaMorte = this.valor_to_string_formatado(this.premioMorte)
            this.calculaTotal()
            this.premioInicio = parseInt(this.premioInvalidez) + parseInt(this.premioMorte)
        },
        salvarProfissao() {
            let profissao = this.listaProfissoes.filter(p => {
                if (p[0] === this.profissao)
                    return Object.entries(p)
                }
            )
            this.cadastro.profissao =  {
                nome: profissao[0][0],
                seguro: profissao[0][1]
            }
            var cadastro = this.firebaseHelper.salvarCadastro(this.dados.chave, 'data/cadastro/informacoes_pessoais', this.cadastro)
            if(cadastro) {
                this.$root.$emit('atualizaProfissao',this.cadastro.profissao.nome)
                this.sliderInvalidez.max = profissao[0][1]
                this.sliderMorte.max = profissao[0][1]
                this.closeModal()
                this.consultaDados()
            }
        },
        showModal() {
            if (this.$refs.ModalProfissao) {
                this.$refs.ModalProfissao.style.display = "block"
            }
        },
        closeModal() {
            if(this.$refs.ModalProfissao) {
                this.$refs.ModalProfissao.style.display = "none"
            }
        },
        getProfissaoParticipante(chave){
            return this.firebaseHelper.getProfissaoParticipante(chave)
                .then(profissao => {
                    if (!profissao) {
                        this.profissao = profissao
                        this.$refs.salvar.style.pointerEvents = 'none'
                        this.$refs.salvar.style.opacity = 0.6
                        this.showModal()
                        return this.firebaseHelper.getProfissoes()
                            .then(ret => {
                                this.listaProfissoes = Object.entries(ret) 
                                this.listaProfissoes.forEach(prof => {
                                    this.profissoes.push(prof[0])
                                })
                            }
                        )
                    } else {
                        this.closeModal()
                    }
                }
            )
        },
        cancelarContratacao(value) {
            this.simulador = value
        },
        calculaTotal(){
            let premio = (parseFloat(this.premioInvalidez) + parseFloat(this.premioMorte)).toFixed(2)
            this.premioTelaTotal = this.valor_to_string_formatado(premio)
            let cobertura = parseFloat(this.coberturaInvalidez) + parseFloat(this.coberturaMorte)
            this.coberturaTelaTotal = this.valor_to_string_formatado(cobertura)
        },
        calculaPremioInvalidez(){
            this.premioInvalidez = (this.coberturaInvalidez * this.dados.fatorInvalidez / 1000).toFixed(2)            
        },
        calculaPremioMorte(){
            this.premioMorte = (this.coberturaMorte * this.dados.fatorMorte / 1000).toFixed(2)            
        },
        valor_to_string_formatado(num) {
            return financeiro.valor_to_string_formatado(num, 2, false, true)            
        },
        toggleCategory(){
            this.toggle = !this.toggle;
        },
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },   
        modalvoltar() {            
            page(`/${sessionStorage.ultimaPagina}`)
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
            this.contratacao.titulo = 'Confirme a </br> alteração do </br>seu seguro'
            this.contratacao.msg_inicial = 'Você está alterando o valor do seu seguro.'
            this.contratacao.msg_vigencia = `A sua nova cobertura estará vigente a partir do mês de ${n}/${d.getFullYear()}.`
            this.contratacao.msg_novo_valor = `O valor do seu novo prêmio mensal é R$ ${this.premioTelaTotal}.`
            this.contratacao.valor_novo = parseFloat(this.premioTelaTotal)
            this.contratacao.valor_novo_Tela = this.premioTelaTotal
            this.contratacao.valor_antigo = this.premioInicio
            this.contratacao.titulo_finalizacao = 'Parabéns!!! </br> Seu prêmio </br> foi alterado'
            this.contratacao.finalizacao_msg = 'Prêmio mensal alterado com sucesso.'
            this.contratacao.finalizacao_msg_novo_valor = 'Você receberá o boleto com o novo valor de R$'
            this.contratacao.chave = this.dados.chave
            this.contratacao.uid =  this.dados.uid
            this.contratacao.label_button = 'Confirma novo valor'
            this.contratacao.tipo = 'Seguro'            
            this.simulador = false
        }
    },
}