'use strict';

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import page from 'page'
import simuladorEmprestimo from './simuladorEmprestimo.html'
import './simuladorEmprestimo.css'
import Contratacao from '../contratacao/contratacao'
import ContratacaoAberta from '../contratacaoAberta/contratacaoAberta'
import FirebaseHelper from '../../FirebaseHelper'

const financeiro = require('../../../functions/Financeiro')
const Enum = require('../../Enum')

export default {
    template: simuladorEmprestimo,
    components: { 
        VueSlider, Contratacao, ContratacaoAberta
    },
    props: {
        uid:'',
        chave:''  
    },    
    data: function() {
        return {   
            firebaseHelper: new FirebaseHelper(),
            titulo: '',
            pre_aprovado: 0,
            saldo_devedor: 0,
            taxa_adm: 0,
            fundo_risco: 0,
            taxa_mensal: 0,
            indice_anterior: 0,
            formatter1: '{value} x',
            quantidade: 36,
            maximo: 0,
            str_maximo: '',
            saldo_devedor: 0,
            minimo: 0,
            str_minimo: '',
            principal: 0,
            valorprincipal:0,
            valido_maximo: true,
            valido_minimo: true,
            parcela: 0,
            simulador: true,
            emprestimoSolicitado: false,
            dadosEmprestimoSolicitado: new Object(),
            money: {
                decimal: ',',
                thousands: '.',
                prefix: 'R$ ',
                suffix: ' ',
                precision: 0,
                masked: false /* doesn't work with directive */
            },            
            sliderOptions: {
                silent: true,
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
                railStyle: {
                    "backgroundColor": "#d3cbcb",
                    "height": "8px",
                    "border-radius": "4px"
                }
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
                resumo: [],
            },
        }
    },
    created(){        
        this.consultaDadosContratados()
    },  
    watch: {
        principal(newValue, oldValue) {
            this.valorprincipal = newValue.replace('R$','')
            this.calcularParcela(parseFloat(this.valorprincipal.toString().replace(/\./g,'')))
        },
        quantidade() {
            this.calcularParcela(parseFloat(this.valorprincipal.toString().replace(/\./g,'')))
        }
    },  
    methods: {      
        consultaDadosContratados() {            
            this.firebaseHelper.getContratacaoEmAberto(this.chave, Enum.contratacao.EMPRESTIMO, Enum.statusContratacao.SOLICITADO).then((data) => {
                if(data){
                    this.processaDadosContratados(data)                
                } else {   
                    this.simulador = true                    
                    this.emprestimoSolicitado = false
                    this.consultaDados()
                } 
            })
        },
        processaDadosContratados(data) {            
            if (data) {
                this.simulador = false
                this.emprestimoSolicitado = true                        
                this.dadosEmprestimoSolicitado.tipo = 'Seguro'
                this.dadosEmprestimoSolicitado.titulo = 'Consulta </br>contratação em </br>aberto'
                this.dadosEmprestimoSolicitado.dados = data
                this.dadosEmprestimoSolicitado.chave = this.chave                
            }
        },        
        consultaDados() {    
            this.firebaseHelper.getDadosSimuladorEmprestimo(this.chave, this.uid).then((ret) => {
                this.montarDados(ret)
            })
        },
        montarDados(dataSimulador) { 
            this.pre_aprovado = financeiro.valor_to_string_formatado(dataSimulador.pre_aprovado, 2, false, true)
            this.saldo_devedor = financeiro.valor_to_string_formatado(dataSimulador.saldo_devedor, 2, false, true)
            this.fundo_risco = dataSimulador.fundo_risco
            this.indice_anterior = dataSimulador.indice_anterior
            this.taxa_adm = dataSimulador.taxa_adm
            this.taxa_mensal = dataSimulador.taxa_mensal
            this.titulo = dataSimulador.titulo
            this.maximo = dataSimulador.pre_aprovado - dataSimulador.saldo_devedor, 
            this.str_maximo = financeiro.valor_to_string_formatado(this.maximo, 2, false, true)
            this.minimo = dataSimulador.saldo_devedor
            this.str_minimo = financeiro.valor_to_string_formatado(this.minimo, 2, false, true)
            this.principal = (this.maximo / 2).toFixed(0)
        },             
        calcularParcela(principal){    
            //console.log('principal',principal)
            //this.principal = this.principal.replace('R$','')
            //let principal = parseFloat(this.principal.toString().replace(/\./g,''))
            if (principal > this.maximo) {
                this.valido_maximo = false
                this.valido_minimo = true
                this.parcela = '0'
            } else if (principal < this.minimo) {
                this.valido_minimo = false
                this.valido_maximo = true
                this.parcela = '0'
            } else {                
                this.valido_maximo = true
                this.valido_minimo = true                
                this.parcela = financeiro.valor_to_string_formatado(financeiro.pgto(principal, this.taxa_mensal, this.quantidade), 2, false, true)
            }
        },        
        // alteraPrincipal(){
        //     this.calcularParcela();
        // },        
        selectAll() {
            this.$refs.inputprincipal.select();
        },
        solicitarEmprestimo(){  
            //console.log('this.principal',this.principal.replace('R$',''))
            let principal = parseFloat(this.principal.replace('R$','').split('.').join('')).toFixed(2)
            //console.log('principal',principal)
            if(this.valido_maximo && this.valido_minimo) {
                this.contratacao.resumo = []
                this.contratacao.titulo = 'Solicite o</br> empréstimo simulado'
                this.contratacao.resumo.push(
                                                { nome:'DADOS DO EMPRÉSTIMO:', valor:'' },
                                                { nome:'Quantidade de parcelas:', valor: this.quantidade },
                                                { nome:'Valor da parcela:', valor: `R$ ${this.parcela}` },
                                                { nome:'(a) Valor bruto contratado:', valor: `R$ ${financeiro.valor_to_string_formatado(principal, 2, false, true)}` },
                                                { nome:'&nbsp;', valor:'' },
                                                { nome:'DEDUÇÕES:', valor:'' }
                                            )
                let liquido = 0
                let risco = 0
                let taxa_adm = 0
                if(this.fundo_risco > 0) {
                    risco = principal * this.fundo_risco / 100
                    taxa_adm = principal * this.taxa_adm / 100
                    this.contratacao.resumo.push(
                                                    {nome:'(b) Taxa Administrativa:', valor: `R$ ${financeiro.valor_to_string_formatado(taxa_adm.toFixed(2), 2, false, true)}`},
                                                    {nome:'(c) Fundo de risco:', valor: `R$ ${financeiro.valor_to_string_formatado(risco.toFixed(2), 2, false, true)}`}
                                                )
                    liquido = principal - risco - taxa_adm
                    if(this.saldo_devedor !== 0) {
                        liquido -= this.saldo_devedor
                        this.contratacao.resumo.push(
                                    { nome:'(d) Saldo remanescente anterior:', valor:`R$ ${this.saldo_devedor}`},
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c - d):', valor:`R$ ${financeiro.valor_to_string_formatado(liquido.toFixed(2), 2, false, true)}*`}
                        )
                    } else {
                        this.contratacao.resumo.push(
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c):', valor:`R$ ${financeiro.valor_to_string_formatado(liquido.toFixed(2), 2, false, true)}*`}
                        )
                    }                    
                } else {                    
                    taxa_adm = principal * this.taxa_adm / 100
                    this.contratacao.resumo.push(
                                                    {nome:'(b) Taxa Administrativa:', valor: `R$ ${financeiro.valor_to_string_formatado(taxa_adm.toFixed(2), 2, false, true)}`},
                                                )
                    liquido = principal - taxa_adm
                    if(this.saldo_devedor !== 0) {
                        liquido -= this.saldo_devedor
                        this.contratacao.resumo.push(
                                    { nome:'(c) Saldo remanescente anterior:', valor:`R$ ${this.saldo_devedor}`},
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c):', valor:`R$ ${financeiro.valor_to_string_formatado(liquido.toFixed(2), 2, false, true)}*`}
                        )
                    } else {
                        this.contratacao.resumo.push(
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b):', valor:`R$ ${financeiro.valor_to_string_formatado(liquido.toFixed(2))}*`}
                        )
                    }
                }                                                
                this.contratacao.msg_inicial = ''
                this.contratacao.msg_vigencia = ''
                this.contratacao.msg_novo_valor = ''
                this.contratacao.observacao = '*Sobre este valor incidirá IOF, calculado na data da assinatura do contrato.'
                this.contratacao.valor_novo = parseFloat(principal)
                this.contratacao.valor_novo_Tela = financeiro.valor_to_string_formatado(principal, 2, false, true)
                this.contratacao.valor_antigo = parseFloat(this.saldo_devedor.toString().replace(/\./g,''))
                this.contratacao.titulo_finalizacao = 'Solicitação </br> de empréstimo </br>encaminhada'
                this.contratacao.finalizacao_msg = 'Em breve entraremos em contato para assinatura do contrato.'
                this.contratacao.finalizacao_msg_novo_valor = 'Valor bruto simulado de R$ '
                this.contratacao.chave = this.chave
                this.contratacao.uid = this.uid
                this.contratacao.label_button = 'Solicitar'
                this.contratacao.tipo = 'Empréstimo'
                this.simulador = false
            }            
        },            
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        cancelarContratacao(value) {
            this.simulador = value
        }
    },
}