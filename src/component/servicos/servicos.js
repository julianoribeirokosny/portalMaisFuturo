'use strict';

import servicos from './servicos.html';
import './servicos.css';
import page from 'page';

export default {  
    template: servicos,    
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
        toggledisplayList(){
            this.displayIcon = false
        },
        toggledisplayIcon(){
            this.displayIcon = true
        }
    },
}
