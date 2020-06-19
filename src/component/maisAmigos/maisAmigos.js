'use strict'

import page from 'page'
import maisAmigos from './maisAmigos.html'
import './maisAmigos.css'

const logo = require('../../../public/images/Component 37 ÔÇô 2@2x.png')
const rede = require('../../../public/images/Component 38 ÔÇô 2@2x.png')

export default {
    template: maisAmigos,
    props: {
        background: ''
    }, 
    data: function() {
        return {      
            titulo: 'Mais<br/>amigos',
            logo: logo,
            rede: rede
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