'use strict';

import VueSlider from 'vue-slider-component'
import 'vue-slider-component/theme/antd.css'
import page from 'page'
import simuladorEmprestimo from './simuladorEmprestimo.html'
import './simuladorEmprestimo.css'
import Contratacao from '../contratacao/contratacao'
import ContratacaoAberta from '../contratacaoAberta/contratacaoAberta'

const financeiro = require('../../../functions/Financeiro')

export default {
    template: simuladorEmprestimo,
    components: { 
        VueSlider, Contratacao, ContratacaoAberta
    },
    props: { 
        dados: {
            type: Object,
            default: () => { 
                return {
                    titulo: '',
                    pre_aprovado: 0,
                    saldo_devedor: 0,
                    taxa_adm: 0,
                    fundo_risco: 0,
                    taxa_mensal: 0,
                    indice_anterior: 0,
                }
            }
        }        
    },    
    data: function() {
        return {   
            taxa_mensal: this.dados.taxa_mensal,
            formatter1: '{value} x',
            quantidade: 36,
            maximo: this.dados.pre_aprovado - this.dados.saldo_devedor, 
            str_maximo: '',
            saldo_devedor: this.dados.saldo_devedor,
            minimo: this.dados.saldo_devedor,
            str_minimo: '',
            principal: 0,
            valido_maximo: true,
            valido_minimo: true,
            parcela: 0,
            simulador: true,
            emprestimoSolicitado: false,
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
        if(this.dados.emprestimoSolicitado.dados != null) {
            this.emprestimoSolicitado = true            
        } else {
            this.dados.pre_aprovado = financeiro.float_to_string(this.dados.pre_aprovado.toFixed(2))
            this.dados.saldo_devedor = financeiro.float_to_string(this.dados.saldo_devedor.toFixed(2))
            this.str_maximo = financeiro.float_to_string(this.maximo.toFixed(2))
            this.str_minimo = financeiro.float_to_string(this.minimo.toFixed(2))
            this.principal = (this.maximo / 2).toFixed(0)
        }
    },
    // mounted(){
    //     this.calcula_taxa_mensal();
    // },
    methods: {      
        calcularParcela(){    
            let principal = parseFloat(this.principal.toString().replace(/\./g,''))
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
                this.parcela = financeiro.float_to_string(financeiro.pgto(principal, this.taxa_mensal, this.quantidade))
            }
        },
        alteraPrincipal(){
            this.calcularParcela();
        },        
        selectAll() {
            this.$refs.inputprincipal.select();
        },
        solicitarEmprestimo(){            
            let principal = parseFloat(this.principal.split('.').join('')).toFixed(2)            
            if(this.valido_maximo && this.valido_minimo) {
                this.contratacao.resumo = []
                this.contratacao.titulo = 'Solicite o</br> empréstimo simulado'
                this.contratacao.resumo.push(
                                                { nome:'DADOS DO EMPRÉSTIMO:', valor:'' },
                                                { nome:'Quantidade de parcelas:', valor: this.quantidade },
                                                { nome:'Valor da parcela:', valor: `R$ ${this.parcela}` },
                                                { nome:'(a) Valor bruto contratado:', valor: `R$ ${financeiro.float_to_string(principal)}` },
                                                { nome:'&nbsp;', valor:'' },
                                                { nome:'DEDUÇÕES:', valor:'' }
                                            )
                let liquido = 0
                let risco = 0
                let taxa_adm = 0
                if(this.dados.fundo_risco > 0) {
                    risco = principal * this.dados.fundo_risco / 100
                    taxa_adm = principal * this.dados.taxa_adm / 100
                    this.contratacao.resumo.push(
                                                    {nome:'(b) Taxa Administrativa:', valor: `R$ ${financeiro.float_to_string(taxa_adm.toFixed(2))}`},
                                                    {nome:'(c) Fundo de risco:', valor: `R$ ${financeiro.float_to_string(risco.toFixed(2))}`}
                                                )
                    liquido = principal - risco - taxa_adm
                    if(this.saldo_devedor !== 0) {
                        liquido -= this.saldo_devedor
                        this.contratacao.resumo.push(
                                    { nome:'(d) Saldo remanescente anterior:', valor:`R$ ${this.dados.saldo_devedor}`},
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c - d):', valor:`R$ ${financeiro.float_to_string(liquido.toFixed(2))}*`}
                        )
                    } else {
                        this.contratacao.resumo.push(
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c):', valor:`R$ ${financeiro.float_to_string(liquido.toFixed(2))}*`}
                        )
                    }                    
                } else {                    
                    taxa_adm = principal * this.dados.taxa_adm / 100
                    this.contratacao.resumo.push(
                                                    {nome:'(b) Taxa Administrativa:', valor: `R$ ${financeiro.float_to_string(taxa_adm.toFixed(2))}`},
                                                )
                    liquido = principal - taxa_adm
                    if(this.saldo_devedor !== 0) {
                        liquido -= this.saldo_devedor
                        this.contratacao.resumo.push(
                                    { nome:'(c) Saldo remanescente anterior:', valor:`R$ ${this.dados.saldo_devedor}`},
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b - c):', valor:`R$ ${financeiro.float_to_string(liquido.toFixed(2))}*`}
                        )
                    } else {
                        this.contratacao.resumo.push(
                                    { nome:'&nbsp;', valor:' ' },
                                    { nome:'VALOR FINAL (a - b):', valor:`R$ ${financeiro.float_to_string(liquido.toFixed(2))}*`}
                        )
                    }
                }                                                
                this.contratacao.msg_inicial = ''
                this.contratacao.msg_vigencia = ''
                this.contratacao.msg_novo_valor = ''
                this.contratacao.observacao = '*Sobre este valor incidirá IOF, calculado na data da assinatura do contrato.'
                this.contratacao.valor_novo = parseFloat(principal)
                this.contratacao.valor_novo_Tela = financeiro.float_to_string(principal)
                this.contratacao.valor_antigo = parseFloat(this.dados.saldo_devedor.toString().replace(/\./g,''))
                this.contratacao.titulo_finalizacao = 'Solicitação </br> de empréstimo </br>encaminhada'
                this.contratacao.finalizacao_msg = 'Em breve entraremos em contato para assinatura do contrato.'
                this.contratacao.finalizacao_msg_novo_valor = 'Valor bruto simulado de R$ '
                this.contratacao.chave = this.dados.chave
                this.contratacao.uid = this.dados.uid
                this.contratacao.label_button = 'Solicitar'
                this.contratacao.tipo = 'Empréstimo'

                //console.log('Novo Valor Emprestimos',this.contratacao.valor_novo)
                this.simulador = false
            }            
        },
        // calcula_taxa_mensal() {  
        //     const data_liberacao = new Date();
        //     const inicio = new Date(data_liberacao.getFullYear(), data_liberacao.getMonth(), 1);
        //     const diferenca = Math.abs(data_liberacao.getTime() - inicio.getTime());
        //     const dias = Math.ceil(diferenca / (1000 * 60 * 60 * 24)) - 1;
        //     this.taxa_mensal = ((1 + this.dados.taxa_mensal/100) * (Math.pow(1 + (this.dados.indice_anterior/100), (dias / 30))) - 1) * 100;
        // },        
        voltar() {
            page(`/${sessionStorage.ultimaPagina}`)
        },
        cancelarContratacao(value) {
            this.simulador = value
        },

    },
}