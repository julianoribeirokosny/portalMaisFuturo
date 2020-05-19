'use strict';

import trocaParticipacao from './trocaParticipacao.html';
import './trocaParticipacao.css';
import page from 'page';
import FirebaseHelper from '../../FirebaseHelper';

export default {  
    template: trocaParticipacao,       
    data: function() {
        return {                       
            firebaseHelper: new FirebaseHelper(),
            foto: sessionStorage.url_foto
        }        
    },
    created(){        
        //this.getParticipante()        
    },
    methods: { 
        getParticipante() {
            return this.firebaseHelper.getParticipante(this.chave_usuario, 'data/cadastro')
                .then( cad => {                        
                    this.cadastro = cad 
                    this.cep = this.cadastro.endereco.cep
                    this.email = this.cadastro.informacoes_pessoais.email                  
                }
            )
        }    
    }
}