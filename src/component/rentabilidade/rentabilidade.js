'use strict';

import vSelect from 'vue-select'; 
import GraficoPerfil from './graficoPerfil';
import GraficoBenchmark from './graficoBenchmark';
import rentabilidade from './rentabilidade.html';
import 'vue-select/dist/vue-select.css';
import './rentabilidade.css';
import FirebaseHelper from '../../FirebaseHelper'

export default {    
    template: rentabilidade,
    components: {
        GraficoPerfil,
        GraficoBenchmark,
        vSelect
    },
    data: function() {
        return {
            titulo:'Confira a rentabilidade <br>do seu Plano',
            firebaseHelper: new FirebaseHelper(), 
            lista: null,
            acumulados: [],
            listaIndices: [],
            grafico_benchmark:null,
            grafico_perfil:null,
            legenda_perfil:null,
            size: 12,
            indices:'',
            acumulado:'',
            indicesPerfil:'',
            quantidade_meses: 'Últ. 12 meses',
            lista_quantidade_meses: ['Últ. 12 meses','Últ. 24 meses','Últ. 36 meses','Últ. 48 meses','Últ. 60 meses'],
            nome_perfil:''
        }
    },
    created() {
        this.getListaDados()
    },    
    watch: {
        quantidade_meses(newVal, oldVal) {
            if (newVal !== oldVal) {
                this.size = parseInt(newVal.replace('Últ. ', '').replace(' meses', ''))
                this.alteraQuantidadeMeses(this.size)
            }
        }
    },
    methods: {      
        getListaDados () {
            this.firebaseHelper.getRentabilidade(sessionStorage.plano, sessionStorage.perfil_investimento).then((data) => {
                if (data) {
                    this.lista = data
                    this.legenda_perfil = this.lista[0].composicao        
                    this.nome_perfil = this.lista[0].nome        
                    this.carregaListaIndice()
                    this.alteraQuantidadeMeses(this.size)
                    this.graficoPerfil()
                }
            })
        },
        graficoPerfil() {
            let labels = []
            let data = []
            let backgroundColor = []
            this.legenda_perfil.forEach(element => {
                labels.push(element.nome)
                data.push(element.valor.replace('%','').replace(',','.'))
                backgroundColor.push(element.cor.replace('color:','').replace(' ',''))
            })
            let perfil = {  labels: labels,
                            data: data,
                            backgroundColor: backgroundColor }
            this.grafico_perfil = perfil
        },        
        carregaListaIndice() {                
            if (this.listaIndices.length === 0) {
                for(var j=0; j < this.lista.length; j++) {
                    let valores = this.lista[j].valores
                    let objeto = {
                        cor: this.lista[j].cor,
                        nome: this.lista[j].nome,
                        valores: valores.slice(0,60)
                    }
                    this.listaIndices.push(objeto)
                }
            }
        },
        alteraQuantidadeMeses(size) {            
            this.calcularIndiceAcumulado(size)
            this.graficoBenchmark(size)
        },
        calcularIndiceAcumulado(size) {
            this.acumulados = []            
            for(var j=0; j < this.listaIndices.length; j++) {
                let objeto = {
                    nome: this.listaIndices[j].nome,
                    cor: `color:${this.listaIndices[j].cor}`
                }                
                let res = 1
                let aux = 1                
                this.indices = this.listaIndices[j].valores.slice(0,size)
                if (j === 0) {
                    this.indicesPerfil = this.listaIndices[j].valores.slice(0,size)
                }                
                for(var i = 0; i < this.indices.length; i++) {
                    aux = this.indices[i].indice / 100 + 1
                    res *= aux
                }
                objeto.indice = parseFloat((res -1)*100).toFixed(2).toString().replace('.',',')
                this.acumulados.push(objeto)
            }
        },
        graficoBenchmark(size) {            
            let grafico = new Object()
            let arr = new Array()
            let labels = new Array()
            for(var i = 0; i <= this.listaIndices.length - 1; i++) {
                let auxReg = this.listaIndices[i].valores.slice(0, size)
                if(i == 0) {
                    for(var j = auxReg.length - 1; j >= 0; j--) {
                        labels.push(auxReg[j].anomes)
                    }
                }
                let auxData = new Object()
                auxData.label = this.listaIndices[i].nome
                auxData.backgroundColor = this.listaIndices[i].cor
                auxData.borderColor = this.listaIndices[i].cor
                auxData.borderWidth = '1.5'
                auxData.lineTension = '0'
                auxData.pointRadius = '0'
                auxData.fill = false
                let valores = new Array()
                let acumulado = 0
                for(var k = auxReg.length - 1; k >= 0; k--) {
                    let indice = 0
                    if(k === (auxReg.length - 1)) {
                        acumulado = auxReg[k].indice
                    } else {
                        indice = auxReg[k].indice/100+1
                        acumulado = (((acumulado/100 + 1) * indice)-1)*100
                    }
                    valores.push(acumulado)
                }
                auxData.data = valores;
                arr.push(auxData);
            }
            grafico.dataset = arr;
            grafico.labels = labels;
            this.grafico_benchmark = grafico;            
        }
    },
}