'use strict';

import contratacao from './contratacao.html';
import './contratacao.css';
import page from 'page'; 
import FirebaseHelper from '../../FirebaseHelper';
import { Utils } from '../../Utils';

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
                    valor_novo: 300,
                    valor_antigo: 200,
                    uid:''
                }
            }
        }
    },    
    data: function() {
        return {
            firebaseHelper: new FirebaseHelper(),
            //utils: new Utils(),
            finalizado: false,
            error_banco: false
        }
    },
    created(){  

    },
    mounted(){

    },
    methods: {
        cancelar(){
            this.$emit('cancelar', true)
        },
        confirmar(){
            let objeto_contratacao = new Object()     
            let dateFormat = Utils.dateFormat(new Date(), true, true)            
            objeto_contratacao[dateFormat] = {
                                                tipo: 'Contribuição mensal',
                                                valor_anterior: this.dados.valor_antigo,
                                                valor_solicitado: this.dados.valor_novo,
                                                status: 'solicitado',
                                                visualizadores: { 
                                                    [this.dados.uid]: {
                                                        data: dateFormat  
                                                    }                                                  
                                                },
                                                cadastro: {
                                                    uid: this.dados.uid,
                                                    data: dateFormat
                                                }
                                            }
            console.log('Objeto:',objeto_contratacao)
            var contratacao = this.firebaseHelper.contratarNovoValor(objeto_contratacao, this.dados.chave)            
            console.log('contratacao',contratacao)
            if(contratacao) {
                this.finalizado = true
            } else if(!contratacao) {
                this.finalizado = false
                this.error_banco = true
            }            
        },
        retornar(){
            page('/home')
        }
    }
}

