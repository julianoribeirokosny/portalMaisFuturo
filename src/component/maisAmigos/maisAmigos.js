'use strict'

import page from 'page'
import maisAmigos from './maisAmigos.html'
import './maisAmigos.css'

export default {
    template: maisAmigos,
    props: {
        background: ''
    }, 
    data: function() {
        return {      
            titulo: 'Mais<br/>amigos'
        }
    },        
    created(){
    },
    methods: {    
        voltar(){
            page('/home')
        }
    },
}