'use strict';

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
        uid:'',
        chave:''
    },    
    data: function() {
        return {
            fatorInvalidez: 0,
            fatorMorte: 0,
            titulo: '',
            bloqueio: false,
            dadosSeguroSolicitado: new Object(),
            novaCoberturaInvalidez: 0,
            novaCoberturaMorte: 0,
            novaCoberturaInvalidezTela: 0,
            novaCoberturaMorteTela: 0,
            dataSimulador: null,
            firebaseHelper: new FirebaseHelper(),
            maximoSemDpsInvalidez: 0,
            maximoSemDpsMorte: 0,
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
        this.consultaDadosContratados()        
    },
    mounted(){
        this.$root.$on('nova::Profissao', () => {
            this.consultaDados()
            this.closeModal()            
        })  
        if (this.bloqueio) {
            if(this.$refs.ModalBloqueioIdade){
                this.$refs.ModalBloqueioIdade.style.display = "block"
            }            
        }
    },
    watch: {
        novaCoberturaInvalidez(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioInvalidez()
                this.novaCoberturaInvalidezTela = this.valor_to_string_formatado(newVal)
                this.premioTelaInvalidez = this.valor_to_string_formatado(this.premioInvalidez)
                this.calculaTotal()
            }
        },
        novaCoberturaMorte(newVal, oldVal) {
            if(newVal !== oldVal) {
                this.calculaPremioMorte()                
                this.novaCoberturaMorteTela = this.valor_to_string_formatado(newVal)
                this.premioTelaMorte = this.valor_to_string_formatado(this.premioMorte)
                this.calculaTotal()
            }
        },
        profissao(newVal){
            if(newVal) {
                if(this.$refs.salvar){
                    this.$refs.salvar.style.pointerEvents = 'visible'
                    this.$refs.salvar.style.opacity = 1
                }
            } else {
                if(this.$refs.salvar){
                    this.$refs.salvar.style.pointerEvents = 'none'
                    this.$refs.salvar.style.opacity = 0.6
                }
            }
        }
    },
    methods: {
        consultaDadosContratados() {            
            this.firebaseHelper.getContratacaoEmAberto(this.chave, 'Seguro', 'solicitado').then((data) => {
                this.processaDadosContratados(data)                
            })
        },
        processaDadosContratados(data) {            
            if (data) {
                this.simulador = false
                this.seguroSolicitado = true                        
                this.dadosSeguroSolicitado.tipo = 'Seguro'
                this.dadosSeguroSolicitado.titulo = 'Consulta </br>contratação em </br>aberto'
                this.dadosSeguroSolicitado.dados = data
                this.dadosSeguroSolicitado.chave = this.chave                
            } else {                
                this.seguroSolicitado = false
                this.carregarDados()
            }
        },
        carregarDados() {
            this.consultaDados()
            this.closeModal()      
        },
        consultaDados() {    
            this.firebaseHelper.getDadosSimuladorSeguro(this.chave, this.uid).then((ret) => {
                this.montarDados(ret)
            })
        },
        montarDados(dataSimulador) {            
            this.fatorInvalidez = dataSimulador.fatorInvalidez
            this.fatorMorte = dataSimulador.fatorMorte
            this.titulo = dataSimulador.titulo
            this.bloqueio = dataSimulador.bloqueio
            this.maximoSemDpsInvalidez =  dataSimulador.maximoSemDpsInvalidez
            this.maximoSemDpsMorte = dataSimulador.maximoSemDpsMorte
            this.coberturaInvalidez = dataSimulador.coberturaInvalidez
            this.coberturaMorte = dataSimulador.coberturaMorte
            this.novaCoberturaInvalidez = dataSimulador.minimoInvalidez
            this.novaCoberturaMorte = dataSimulador.minimoMorte
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
            var cadastro = this.firebaseHelper.salvarCadastro(this.chave, 'data/cadastro/informacoes_pessoais', this.cadastro)
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
                        if (this.$refs.salvar) {
                            this.$refs.salvar.style.pointerEvents = 'none'
                            this.$refs.salvar.style.opacity = 0.6
                        }
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
            let cobertura = parseFloat(this.novaCoberturaInvalidez) + parseFloat(this.novaCoberturaMorte)
            this.coberturaTelaTotal = this.valor_to_string_formatado(cobertura)
        },
        calculaPremioInvalidez(){
            this.premioInvalidez = (this.novaCoberturaInvalidez * this.fatorInvalidez / 1000).toFixed(2)            
        },
        calculaPremioMorte(){
            this.premioMorte = (this.novaCoberturaMorte * this.fatorMorte / 1000).toFixed(2)            
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
            this.contratacao.chave = this.chave
            this.contratacao.uid =  this.uid
            this.contratacao.label_button = 'Confirma novo valor'
            this.contratacao.tipo = 'Seguro'
            this.contratacao.detalhes = {
                premio_total_solicitado: this.premioTelaTotal,
                premio_invalidez_solicitado: this.premioInvalidez,
                premio_morte_solicitado: this.premioMorte,                
                cobertura_invalidez_solicitado: this.novaCoberturaInvalidez,
                cobertura_morte_solicitado: this.novaCoberturaMorte
            }
            this.simulador = false
        }
    },
}