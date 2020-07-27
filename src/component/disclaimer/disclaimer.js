'use strict'

import disclaimer from './disclaimer.html'
import './disclaimer.css'

export default {
    template: disclaimer, 
    props: {
        mensagem: '',         
    }, 
    // data: function() {
    //     return { 
    //         msg:''
    //     }        
    // },          
    // created(){
    //     debugger
    //     this.msg = this.mensagem
    // }, 
    methods: {
        closeModal(modal) {
            this.$refs[modal].style.display = "none"
        },
        openModal(modal) {
            this.$refs[modal].style.display = "block"
        }
    },
}