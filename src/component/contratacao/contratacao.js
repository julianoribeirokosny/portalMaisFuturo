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
const { tiposSolicitacaoPipefy, statusContratacao } = require('../../Enum')
const financeiro = require('../../../functions/Financeiro')

export default {    
    template: contratacao,
    props: {
        dados: {            
        },
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),            
            finalizado: false,
            errorBanco: false,
            erroContratacao: false,
            dps: false,
            stringRequest: '',
        }
    },   
    mounted(){
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
                        status: statusContratacao.SOLICITADO,
                        detalhes: detalhes,
                        pipeId: ret.data.pipeId,
                        cardId: response.data.createCard.card.id,
                        resumo: this.dados.resumo ? this.dados.resumo : null
                    }

                    var contratacao = this.firebaseHelper.contratarNovoValor(objeto_contratacao, this.dados.chave)
                    if(contratacao) {
                        this.finalizado = true
                    } else if(!contratacao) {
                        this.finalizado = false
                        this.errorBanco = true
                    }          
                    if (this.dados.dps) {
                        this.dps = true
                        this.preencherDPS()
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
        },
        preencherDPS(){
            let usuario = JSON.parse(sessionStorage.participante)
            let nome =        usuario.data.cadastro.informacoes_pessoais.nome.replace(/ /gi,'+').toUpperCase()
            let sexo =        usuario.data.cadastro.informacoes_pessoais.sexo.toUpperCase()
            let nasc =        usuario.data.cadastro.informacoes_pessoais.nascimento.replace('/','-').replace('/','-')
            let cpf =         usuario.data.cadastro.informacoes_pessoais.cpf.replace('.','').replace('.','').replace('-','')
            let email =       usuario.data.cadastro.informacoes_pessoais.email.replace('@','%40')
            let fone =        usuario.data.cadastro.informacoes_pessoais.celular.replace(/ /gi,'').replace(/\+/gi,'').replace(/-/gi,'').replace('(','').replace(')','')
            let estadocivil = usuario.data.cadastro.informacoes_pessoais.estado_civil.toUpperCase()
            let teto =        usuario.data.cadastro.informacoes_pessoais.profissao.seguro
            let profissao =   usuario.data.cadastro.informacoes_pessoais.profissao.nome.replace(/ /gi,'+').toLowerCase()           
            let cob_morte =   this.dados.detalhes.cobertura_morte_solicitado
            let cob_invalidez = this.dados.detalhes.cobertura_invalidez_solicitado
            let contr = (parseFloat(this.dados.detalhes.premio_total_solicitado)).toFixed(2)
            let premio_morte = this.dados.detalhes.premio_morte_solicitado.replace('.','%2c')
            let premio_inva = this.dados.detalhes.premio_invalidez_solicitado.replace('.','%2c') 
            let stringRequest = `https://previdenciadigital.com.br/contratar-portal/?nome=${nome}&sexo=${sexo}&nasc=${nasc}&cpf=${cpf}&contr=${contr}&email=${email}&fone=${fone}&estadocivil=${estadocivil}&teto=${teto}&premio_morte=${premio_morte}&premio_inva=${premio_inva}&cob_morte=${cob_morte}&cob_invalidez=${cob_invalidez}&prof=${profissao}`
            this.requestDPS(stringRequest)
            base_spinner.style.display = 'none'
        },
        requestDPS(string) {   
            base_spinner.style.display = 'flex'                 
            this.stringRequest = string
            setTimeout(function() {
                base_spinner.style.display = 'none'
            }, 8000)
        }
    }
}

