'use strict';

import contratacao from './contratacao.html';
import './contratacao.css';
import page from 'page'; 
import FirebaseHelper from '../../FirebaseHelper';
import firebase from "firebase/app";
import "firebase/functions";   

const functions = firebase.functions()
const apiPipefy = functions.httpsCallable('apiPipefy')
const utils = require('../../../functions/utilsFunctions')
const { tiposSolicitacaoPipefy } = require('../../Enum')
const financeiro = require('../../../functions/Financeiro')

export default {    
    template: contratacao,
    props: { 
        dados: {            
            /*type: Object,
            default: () => { 
                return {
                    titulo: 'Adesão',
                    titulo_finalizacao: 'Parabéns!!!',
                    msg_inicial: '',
                    msg_vigencia: '',
                    msg_novo_valor: '',
                    valor_novo: 0,
                    valor_antigo: 0,
                    detalhes: null,
                    uid:''
                }
            }*/
        }
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),            
            finalizado: false,
            errorBanco: false,
            erroContratacao: false
        }
    },  
    watch: {          
        erroContratacao(val) {
            if (val) {
                this.intervaloMSG()
            }
        },
        errorBanco(val) {
            if (val) {
                this.intervaloMSG()
            }
        }
    },      
    methods: {
        cancelar(){
            this.$emit('cancelar', true)
        },
        confirmar(){
            let objeto_contratacao = new Object()     
            let dateFormat = utils.dateFormat(new Date(), true, true, false)
            let detalhes = ''
            if (this.dados.detalhes) {
                detalhes = this.dados.detalhes
            }

            let dadosCard = {
                tipoSolicitacao: tiposSolicitacaoPipefy[this.dados.tipo],
                chave: this.dados.chave,
                dadosAnteriores: financeiro.valor_to_string_formatado(this.dados.valor_antigo, 2, true, true),
                dadosNovos: financeiro.valor_to_string_formatado(this.dados.valor_novo, 2, true, true),
                matricula: this.dados.matricula,
                plano: this.dados.plano
            }

            base_spinner.style.display = 'flex'
            //primeiro grava card no Pipefy
            apiPipefy({acao: 'criarCard', body: dadosCard}).then((ret) => { 
                if (!ret.data.sucesso) {
                    this.erroContratacao = true
                    base_spinner.style.display = 'none'
                    /* TODO 
                    1. chamar método de Log de Erros!
                    2. Chamar tela geral de erros
                    */
                } else {
                    console.log('SUCESSO!!!!')
                    let response = ret.data.response
                    objeto_contratacao[dateFormat] = {
                        uid: this.dados.uid,
                        tipo: this.dados.tipo,
                        valor_anterior: this.dados.valor_antigo,
                        valor_solicitado: this.dados.valor_novo,
                        status: 'solicitado',
                        detalhes: detalhes,
                        pipeId: ret.data.pipeId,
                        cardId: response.data.createCard.card.id
                    }

                    var contratacao = this.firebaseHelper.contratarNovoValor(objeto_contratacao, this.dados.chave)
                    if(contratacao) {
                        this.finalizado = true
                    } else if(!contratacao) {
                        this.finalizado = false
                        this.errorBanco = true
                    }          
                    base_spinner.style.display = 'none'                      
                    return true
                }  
            }).catch((e) => {
                this.erroContratacao = true
                base_spinner.style.display = 'none'
            })                                      
        },
        retornar(){
            if(sessionStorage.ultimaPagina == 'servicos') {
                this.$emit('recarregarDados')          
            } 
            page(`/${sessionStorage.ultimaPagina}`)
        },
        intervaloMSG() {
            setInterval(() => {
                this.errorBanco = false
                this.erroContratacao = false
            }, 10000);
        }
    }
}

