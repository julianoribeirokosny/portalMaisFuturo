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
            firebaseHelper: new FirebaseHelper(),
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
            coberturaInvalidez: this.dados.coberturaInvalidez,
            coberturaTelaInvalidez: '0',
            premioInvalidez: 0,
            premioTelaInvalidez: '0',
            maximoSemDpsInvalidezTela: '0',
            corMorte: '#8BCF7B',
            coberturaMorte: this.dados.coberturaMorte,
            coberturaTelaMorte: '0',
            maximoSemDpsMorteTela: '0',
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
        //console.log('this.dados_Seguro',this.dados)        
        if(this.dados.seguroSolicitado.dados != null) {
            this.seguroSolicitado = true
        } else {
            this.getProfissaoParticipante(this.dados.chave)

            this.maximoSemDpsInvalidezTela = this.thousands_separators(this.dados.maximoSemDpsInvalidez)
            //console.log('this.maximoSemDpsInvalidezTela',this.maximoSemDpsInvalidezTela)
            this.maximoSemDpsMorteTela = this.thousands_separators(this.dados.maximoSemDpsMorte)
            this.calculaPremioInvalidez()
            this.coberturaTelaInvalidez = this.thousands_separators(this.coberturaInvalidez)
            this.premioTelaInvalidez = this.thousands_separators(this.premioInvalidez)
            this.calculaPremioMorte()
            this.coberturaTelaMorte = this.thousands_separators(this.coberturaMorte)
            this.premioTelaMorte = this.thousands_separators(this.premioMorte)
            this.calculaTotal()
            this.premioInicio = parseInt(this.premioInvalidez) + parseInt(this.premioMorte)
            //console.log('this.premioInicio',this.premioInicio)
        }
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

            console.log('Cadastro Profissao',this.cadastro.profissao)
            var cadastro = this.firebaseHelper.salvarCadastro(this.dados.chave, 'data/cadastro/informacoes_pessoais', this.cadastro)
            if(cadastro) {
                this.sliderInvalidez.max = profissao[0][1].Invalidez
                this.sliderMorte.max = profissao[0][1].Morte
                this.closeModal()
                page(`/home`)
            } else {
                alert('error')
            }
        },
        showModal() {
            this.$refs.ModalProfissao.style.display = "block";
        },
        closeModal() {
            this.$refs.ModalProfissao.style.display = "none";
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
                    }
                }
            )
        },
        cancelarContratacao(value) {
            this.simulador = value
        },
        calculaTotal(){
            let premio = parseFloat(this.premioInvalidez) + parseFloat(this.premioMorte)
            this.premioTelaTotal = this.thousands_separators(premio)
            let cobertura = parseFloat(this.coberturaInvalidez) + parseFloat(this.coberturaMorte)
            this.coberturaTelaTotal = this.thousands_separators(cobertura)
        },
        calculaPremioInvalidez(){
            this.premioInvalidez = (this.coberturaInvalidez * this.dados.fatorInvalidez / 1000).toFixed(0)
            //console.log('this.premioInvalidez',this.premioInvalidez)
        },
        calculaPremioMorte(){
            this.premioMorte = (this.coberturaMorte * this.dados.fatorMorte / 1000).toFixed(0)
            //console.log('this.premioMorte',this.premioMorte)
        },
        thousands_separators(num) {
            let numero = String(num).replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ".")
            return numero
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