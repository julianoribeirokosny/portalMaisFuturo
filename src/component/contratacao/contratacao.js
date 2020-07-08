'use strict';

import contratacao from './contratacao.html';
import './contratacao.css';
import page from 'page'; 
import FirebaseHelper from '../../FirebaseHelper';

const utils = require('../../../functions/utilsFunctions')

export default {    
    template: contratacao,
    props: { 
        dados: {            
            type: Object,
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
            }
        }
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),            
            finalizado: false,
            error_banco: false
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
            objeto_contratacao[dateFormat] = {
                                                uid: this.dados.uid,
                                                tipo: this.dados.tipo,
                                                valor_anterior: this.dados.valor_antigo,
                                                valor_solicitado: this.dados.valor_novo,
                                                status: 'solicitado',
                                                detalhes: detalhes
                                            }
                                        
            var contratacao = this.firebaseHelper.contratarNovoValor(objeto_contratacao, this.dados.chave)
            if(contratacao) {
                this.finalizado = true
            } else if(!contratacao) {
                this.finalizado = false
                this.error_banco = true
            }            
        },
        retornar(){
            if(sessionStorage.ultimaPagina == 'servicos') {
                this.$emit('recarregarDados')          
            } 
            page(`/${sessionStorage.ultimaPagina}`)
        }
    }
}

