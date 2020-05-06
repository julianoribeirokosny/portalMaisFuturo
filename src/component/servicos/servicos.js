'use strict';

import servicos from './servicos.html';
import './servicos.css';
import page from 'page';
//import emConstrucao from '../emConstrucao/emConstrucao';

export default {  
    template: servicos,   
    //components: { emConstrucao }, 
    props: {
        
    },    
    data: function() {
        return {           
            displayIcon: true
        }        
    },
    created(){
    },
    mounted(){
        
    },
    watch: {    
        
    },
    methods: { 
        toggledisplayList() {
            this.displayIcon = false
        },
        toggledisplayIcon() {
            this.displayIcon = true
        },
        clickPage(link) {  
            sessionStorage.ultimaPagina = 'servicos'
            page(`/${link}`)
        }
    }, 
}
