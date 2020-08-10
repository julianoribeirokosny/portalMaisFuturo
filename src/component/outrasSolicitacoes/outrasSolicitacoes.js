'use strict'
import outrasSolicitacoes from './outrasSolicitacoes.html'
import './outrasSolicitacoes.css'

export default {
    template: outrasSolicitacoes,
    props: {
        background: ''
    }, 
    data: function() {
        console.log('===========> Outras Solicitaçoe!!!!!!!!!!!!')
        return {      
            titulo: 'Outras<br/>Solicitações'
        }
    },        
    created(){
        /*var cssLink = document.createElement("link");
        cssLink.href = "./outrassolicitacoes.css";  
        cssLink.rel = "stylesheet";  
        cssLink.type = "text/css";  
        frames['formPipe'].document.body.appendChild(cssLink); */
    },
    methods: {    
        voltar(){
            page('/home')
        }
    },
}