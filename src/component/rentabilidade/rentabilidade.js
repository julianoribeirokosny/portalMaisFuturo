'use strict';

import vSelect from 'vue-select'; 
import GraficoPerfil from './graficoPerfil';
import GraficoBenchmark from './graficoBenchmark';

import rentabilidade from './rentabilidade.html';
import 'vue-select/dist/vue-select.css';
import './rentabilidade.css';

export default {    
    template: rentabilidade,
    components: {
        GraficoPerfil,
        GraficoBenchmark,
        vSelect
    },
    props: {         
        dados: {
            type: Object,
            default: () => { 
                return {                    
                    titulo:'Confira a rentabilidade <br>do seu plano',
                    legenda_perfil: [
                        {
                            nome: 'Renda Fixa',
                            valor:'59,3%',
                            cor:'color: #8ACE7B'
                        },{
                            nome: 'Renda Variável',
                            valor:'38,2%',
                            cor:'color: #033166'
                        },{
                            nome: 'Empréstimo Pessoal',
                            valor:'2,5%',
                            cor:'color:#1779C6'
                        }
                    ],
                    indices: [
                        {  
                            nome:'Agressivo',
                            cor:'#1E77C6',
                            valores:[
                        {anomes:'jan/20', valor:'0,01%', indice:0.01},
                        {anomes:'dez/19', valor:'5,91%', indice:5.91},
                        {anomes:'nov/19', valor:'-0,05%', indice:-0.05},
                        {anomes:'out/19', valor:'2,47%', indice:2.47},
                        {anomes:'set/19', valor:'1,75%', indice:1.75},
                        {anomes:'ago/19', valor:'0,29%', indice:0.29},
                        {anomes:'jul/19', valor:'1,08%', indice:1.08},
                        {anomes:'jun/19', valor:'3,43%', indice:3.43},
                        {anomes:'mai/19', valor:'1,9%', indice:1.9},
                        {anomes:'abr/19', valor:'1,2%', indice:1.2},
                        {anomes:'mar/19', valor:'-0,39%', indice:-0.39},
                        {anomes:'fev/19', valor:'0,37%', indice:0.37},
                        {anomes:'jan/19', valor:'5,02%', indice:5.02},
                        {anomes:'dez/18', valor:'0,87%', indice:0.87},
                        {anomes:'nov/18', valor:'1,82%', indice:1.82},
                        {anomes:'out/18', valor:'4,9%', indice:4.9},
                        {anomes:'set/18', valor:'-0,49%', indice:-0.49},
                        {anomes:'ago/18', valor:'-2,43%', indice:-2.43},
                        {anomes:'jul/18', valor:'2,6%', indice:2.6},
                        {anomes:'jun/18', valor:'-0,99%', indice:-0.99},
                        {anomes:'mai/18', valor:'-2,64%', indice:-2.64},
                        {anomes:'abr/18', valor:'-0,25%', indice:-0.25},
                        {anomes:'mar/18', valor:'0,27%', indice:0.27},
                        {anomes:'fev/18', valor:'1,03%', indice:1.03},
                        {anomes:'jan/18', valor:'3,09%', indice:3.09},
                        {anomes:'dez/17', valor:'1,6%', indice:1.6},
                        {anomes:'nov/17', valor:'0,47%', indice:0.47},
                        {anomes:'out/17', valor:'0,24%', indice:0.24},
                        {anomes:'set/17', valor:'1,96%', indice:1.96},
                        {anomes:'ago/17', valor:'3,64%', indice:3.64},
                        {anomes:'jul/17', valor:'2,59%', indice:2.59},
                        {anomes:'jun/17', valor:'-0,02%', indice:-0.02},
                        {anomes:'mai/17', valor:'0,36%', indice:0.36},
                        {anomes:'abr/17', valor:'1,01%', indice:1.01},
                        {anomes:'mar/17', valor:'0,3%', indice:0.3},
                        {anomes:'fev/17', valor:'1,38%', indice:1.38},
                        {anomes:'jan/17', valor:'1,74%', indice:1.74},
                        {anomes:'dez/16', valor:'0,46%', indice:0.46},
                        {anomes:'nov/16', valor:'-2,36%', indice:-2.36},
                        {anomes:'out/16', valor:'0,8%', indice:0.8},
                        {anomes:'set/16', valor:'-0,16%', indice:-0.16},
                        {anomes:'ago/16', valor:'0,83%', indice:0.83},
                        {anomes:'jul/16', valor:'4,5%', indice:4.5},
                        {anomes:'jun/16', valor:'2,4%', indice:2.4},
                        {anomes:'mai/16', valor:'-0,68%', indice:-0.68},
                        {anomes:'abr/16', valor:'1,7%', indice:1.7},
                        {anomes:'mar/16', valor:'4,46%', indice:4.46},
                        {anomes:'fev/16', valor:'2,18%', indice:2.18},
                        {anomes:'jan/16', valor:'-0,67%', indice:-0.67},
                        {anomes:'dez/15', valor:'0,75%', indice:0.75},
                        {anomes:'nov/15', valor:'0,89%', indice:0.89},
                        {anomes:'out/15', valor:'2,09%', indice:2.09},
                        {anomes:'set/15', valor:'0,1%', indice:0.1},
                        {anomes:'ago/15', valor:'-1,89%', indice:-1.89},
                        {anomes:'jul/15', valor:'-0,18%', indice:-0.18},
                        {anomes:'jun/15', valor:'0,89%', indice:0.89},
                        {anomes:'mai/15', valor:'-0,79%', indice:-0.79},
                        {anomes:'abr/15', valor:'2,4%', indice:2.4},
                        {anomes:'mar/15', valor:'0,98%', indice:0.98},
                                {anomes:'fev/15', valor:'2,34%', indice:2.34}
                            ]
                        },{
                            nome:'IBovespa',
                            cor:'#8CD07B',
                            valores:[
                                {anomes:'jan/20', valor:'-1,63%', indice:-1.63},
                                {anomes:'dez/19', valor:'6,85%', indice:6.85},
                                {anomes:'nov/19', valor:'0,95%', indice:0.95},
                                {anomes:'out/19', valor:'2,36%', indice:2.36},
                                {anomes:'set/19', valor:'3,57%', indice:3.57},
                                {anomes:'ago/19', valor:'-0,67%', indice:-0.67},
                                {anomes:'jul/19', valor:'0,84%', indice:0.84},
                                {anomes:'jun/19', valor:'4,06%', indice:4.06},
                                {anomes:'mai/19', valor:'0,7%', indice:0.7},
                                {anomes:'abr/19', valor:'0,98%', indice:0.98},
                                {anomes:'mar/19', valor:'-0,18%', indice:-0.18},
                                {anomes:'fev/19', valor:'-1,86%', indice:-1.86},
                                {anomes:'jan/19', valor:'10,82%', indice:10.82},
                                {anomes:'dez/18', valor:'-1,81%', indice:-1.81},
                                {anomes:'nov/18', valor:'2,38%', indice:2.38},
                                {anomes:'out/18', valor:'10,19%', indice:10.19},
                                {anomes:'set/18', valor:'3,48%', indice:3.48},
                                {anomes:'ago/18', valor:'-3,21%', indice:-3.21},
                                {anomes:'jul/18', valor:'8,88%', indice:8.88},
                                {anomes:'jun/18', valor:'-5,2%', indice:-5.2},
                                {anomes:'mai/18', valor:'-10,87%', indice:-10.87},
                                {anomes:'abr/18', valor:'0,88%', indice:0.88},
                                {anomes:'mar/18', valor:'0,01%', indice:0.01},
                                {anomes:'fev/18', valor:'0,52%', indice:0.52},
                                {anomes:'jan/18', valor:'11,14%', indice:11.14},
                                {anomes:'dez/17', valor:'6,16%', indice:6.16},
                                {anomes:'nov/17', valor:'-3,15%', indice:-3.15},
                                {anomes:'out/17', valor:'0,02%', indice:0.02},
                                {anomes:'set/17', valor:'4,88%', indice:4.88},
                                {anomes:'ago/17', valor:'7,46%', indice:7.46},
                                {anomes:'jul/17', valor:'4,8%', indice:4.8},
                                {anomes:'jun/17', valor:'0,3%', indice:0.3},
                                {anomes:'mai/17', valor:'-4,12%', indice:-4.12},
                                {anomes:'abr/17', valor:'0,64%', indice:0.64},
                                {anomes:'mar/17', valor:'-2,52%', indice:-2.52},
                                {anomes:'fev/17', valor:'3,08%', indice:3.08},
                                {anomes:'jan/17', valor:'7,38%', indice:7.38},
                                {anomes:'dez/16', valor:'-2,71%', indice:-2.71},
                                {anomes:'nov/16', valor:'-4,65%', indice:-4.65},
                                {anomes:'out/16', valor:'11,23%', indice:11.23},
                                {anomes:'set/16', valor:'0,8%', indice:0.8},
                                {anomes:'ago/16', valor:'1,03%', indice:1.03},
                                {anomes:'jul/16', valor:'11,22%', indice:11.22},
                                {anomes:'jun/16', valor:'6,3%', indice:6.3},
                                {anomes:'mai/16', valor:'-10,09%', indice:-10.09},
                                {anomes:'abr/16', valor:'7,7%', indice:7.7},
                                {anomes:'mar/16', valor:'16,97%', indice:16.97},
                                {anomes:'fev/16', valor:'5,91%', indice:5.91},
                                {anomes:'jan/16', valor:'-6,79%', indice:-6.79},
                                {anomes:'dez/15', valor:'-3,93%', indice:-3.93},
                                {anomes:'nov/15', valor:'-1,63%', indice:-1.63},
                                {anomes:'out/15', valor:'1,8%', indice:1.8},
                                {anomes:'set/15', valor:'-3,36%', indice:-3.36},
                                {anomes:'ago/15', valor:'-8,33%', indice:-8.33},
                                {anomes:'jul/15', valor:'-4,17%', indice:-4.17},
                                {anomes:'jun/15', valor:'0,61%', indice:0.61},
                                {anomes:'mai/15', valor:'-6,17%', indice:-6.17},
                                {anomes:'abr/15', valor:'9,93%', indice:9.93},
                                {anomes:'mar/15', valor:'-0,84%', indice:-0.84},
                                {anomes:'fev/15', valor:'9,97%', indice:9.97}

                            ]
                        }, {
                            nome:'CDI',
                            cor:'#FF8181',
                            valores:[
                                {anomes:'jan/20', valor:'0,38%', indice:0.38},
                                {anomes:'dez/19', valor:'0,37%', indice:0.37},
                                {anomes:'nov/19', valor:'0,38%', indice:0.38},
                                {anomes:'out/19', valor:'0,48%', indice:0.48},
                                {anomes:'set/19', valor:'0,46%', indice:0.46},
                                {anomes:'ago/19', valor:'0,5%', indice:0.5},
                                {anomes:'jul/19', valor:'0,57%', indice:0.57},
                                {anomes:'jun/19', valor:'0,47%', indice:0.47},
                                {anomes:'mai/19', valor:'0,54%', indice:0.54},
                                {anomes:'abr/19', valor:'0,52%', indice:0.52},
                                {anomes:'mar/19', valor:'0,47%', indice:0.47},
                                {anomes:'fev/19', valor:'0,49%', indice:0.49},
                                {anomes:'jan/19', valor:'0,54%', indice:0.54},
                                {anomes:'dez/18', valor:'0,49%', indice:0.49},
                                {anomes:'nov/18', valor:'0,49%', indice:0.49},
                                {anomes:'out/18', valor:'0,54%', indice:0.54},
                                {anomes:'set/18', valor:'0,47%', indice:0.47},
                                {anomes:'ago/18', valor:'0,57%', indice:0.57},
                                {anomes:'jul/18', valor:'0,54%', indice:0.54},
                                {anomes:'jun/18', valor:'0,52%', indice:0.52},
                                {anomes:'mai/18', valor:'0,52%', indice:0.52},
                                {anomes:'abr/18', valor:'0,52%', indice:0.52},
                                {anomes:'mar/18', valor:'0,53%', indice:0.53},
                                {anomes:'fev/18', valor:'0,46%', indice:0.46},
                                {anomes:'jan/18', valor:'0,58%', indice:0.58},
                                {anomes:'dez/17', valor:'0,54%', indice:0.54},
                                {anomes:'nov/17', valor:'0,57%', indice:0.57},
                                {anomes:'out/17', valor:'0,64%', indice:0.64},
                                {anomes:'set/17', valor:'0,64%', indice:0.64},
                                {anomes:'ago/17', valor:'0,8%', indice:0.8},
                                {anomes:'jul/17', valor:'0,8%', indice:0.8},
                                {anomes:'jun/17', valor:'0,81%', indice:0.81},
                                {anomes:'mai/17', valor:'0,93%', indice:0.93},
                                {anomes:'abr/17', valor:'0,79%', indice:0.79},
                                {anomes:'mar/17', valor:'1,05%', indice:1.05},
                                {anomes:'fev/17', valor:'0,86%', indice:0.86},
                                {anomes:'jan/17', valor:'1,08%', indice:1.08},
                                {anomes:'dez/16', valor:'1,12%', indice:1.12},
                                {anomes:'nov/16', valor:'1,04%', indice:1.04},
                                {anomes:'out/16', valor:'1,05%', indice:1.05},
                                {anomes:'set/16', valor:'1,11%', indice:1.11},
                                {anomes:'ago/16', valor:'1,21%', indice:1.21},
                                {anomes:'jul/16', valor:'1,11%', indice:1.11},
                                {anomes:'jun/16', valor:'1,16%', indice:1.16},
                                {anomes:'mai/16', valor:'1,11%', indice:1.11},
                                {anomes:'abr/16', valor:'1,05%', indice:1.05},
                                {anomes:'mar/16', valor:'1,16%', indice:1.16},
                                {anomes:'fev/16', valor:'1%', indice:1},
                                {anomes:'jan/16', valor:'1,05%', indice:1.05},
                                {anomes:'dez/15', valor:'1,16%', indice:1.16},
                                {anomes:'nov/15', valor:'1,06%', indice:1.06},
                                {anomes:'out/15', valor:'1,11%', indice:1.11},
                                {anomes:'set/15', valor:'1,11%', indice:1.11},
                                {anomes:'ago/15', valor:'1,11%', indice:1.11},
                                {anomes:'jul/15', valor:'1,18%', indice:1.18},
                                {anomes:'jun/15', valor:'1,07%', indice:1.07},
                                {anomes:'mai/15', valor:'0,98%', indice:0.98},
                                {anomes:'abr/15', valor:'0,95%', indice:0.95},
                                {anomes:'mar/15', valor:'1,04%', indice:1.04},
                                {anomes:'fev/15', valor:'0,82%', indice:0.82}
                                ]
                        }, {
                            nome:'Meta Atuarial',
                            cor:'#003366',
                            valores:[
                                {anomes:'jan/20', valor:'0,56%', indice:0.56},
                                {anomes:'dez/19', valor:'1,59%', indice:1.59},
                                {anomes:'nov/19', valor:'0,89%', indice:0.89},
                                {anomes:'out/19', valor:'0,44%', indice:0.44},
                                {anomes:'set/19', valor:'0,32%', indice:0.32},
                                {anomes:'ago/19', valor:'0,51%', indice:0.51},
                                {anomes:'jul/19', valor:'0,5%', indice:0.5},
                                {anomes:'jun/19', valor:'0,34%', indice:0.34},
                                {anomes:'mai/19', valor:'0,54%', indice:0.54},
                                {anomes:'abr/19', valor:'0,97%', indice:0.97},
                                {anomes:'mar/19', valor:'1,1%', indice:1.1},
                                {anomes:'fev/19', valor:'0,89%', indice:0.89},
                                {anomes:'jan/19', valor:'0,75%', indice:0.75},
                                {anomes:'dez/18', valor:'0,49%', indice:0.49},
                                {anomes:'nov/18', valor:'0,1%', indice:0.1},
                                {anomes:'out/18', valor:'0,79%', indice:0.79},
                                {anomes:'set/18', valor:'0,63%', indice:0.63},
                                {anomes:'ago/18', valor:'0,4%', indice:0.4},
                                {anomes:'jul/18', valor:'0,64%', indice:0.64},
                                {anomes:'jun/18', valor:'1,8%', indice:1.8},
                                {anomes:'mai/18', valor:'0,8%', indice:0.8},
                                {anomes:'abr/18', valor:'0,58%', indice:0.58},
                                {anomes:'mar/18', valor:'0,44%', indice:0.44},
                                {anomes:'fev/18', valor:'0,5%', indice:0.5},
                                {anomes:'jan/18', valor:'0,62%', indice:0.62},
                                {anomes:'dez/17', valor:'0,61%', indice:0.61},
                                {anomes:'nov/17', valor:'0,53%', indice:0.53},
                                {anomes:'out/17', valor:'0,74%', indice:0.74},
                                {anomes:'set/17', valor:'0,33%', indice:0.33},
                                {anomes:'ago/17', valor:'0,37%', indice:0.37},
                                {anomes:'jul/17', valor:'0,54%', indice:0.54},
                                {anomes:'jun/17', valor:'0,07%', indice:0.07},
                                {anomes:'mai/17', valor:'0,75%', indice:0.75},
                                {anomes:'abr/17', valor:'0,4%', indice:0.4},
                                {anomes:'mar/17', valor:'0,72%', indice:0.72},
                                {anomes:'fev/17', valor:'0,56%', indice:0.56},
                                {anomes:'jan/17', valor:'0,81%', indice:0.81},
                                {anomes:'dez/16', valor:'0,53%', indice:0.53},
                                {anomes:'nov/16', valor:'0,42%', indice:0.42},
                                {anomes:'out/16', valor:'0,52%', indice:0.52},
                                {anomes:'set/16', valor:'0,45%', indice:0.45},
                                {anomes:'ago/16', valor:'0,71%', indice:0.71},
                                {anomes:'jul/16', valor:'1,01%', indice:1.01},
                                {anomes:'jun/16', valor:'0,86%', indice:0.86},
                                {anomes:'mai/16', valor:'1,35%', indice:1.35},
                                {anomes:'abr/16', valor:'0,99%', indice:0.99},
                                {anomes:'mar/16', valor:'0,83%', indice:0.83},
                                {anomes:'fev/16', valor:'1,29%', indice:1.29},
                                {anomes:'jan/16', valor:'1,87%', indice:1.87},
                                {anomes:'dez/15', valor:'1,29%', indice:1.29},
                                {anomes:'nov/15', valor:'1,46%', indice:1.46},
                                {anomes:'out/15', valor:'1,14%', indice:1.14},
                                {anomes:'set/15', valor:'0,88%', indice:0.88},
                                {anomes:'ago/15', valor:'0,62%', indice:0.62},
                                {anomes:'jul/15', valor:'0,98%', indice:0.98},
                                {anomes:'jun/15', valor:'1,14%', indice:1.14},
                                {anomes:'mai/15', valor:'1,34%', indice:1.34},
                                {anomes:'abr/15', valor:'1,06%', indice:1.06},
                                {anomes:'mar/15', valor:'1,9%', indice:1.9},
                                {anomes:'fev/15', valor:'1,48%', indice:1.48}                            
                            ]
                        }
                    ]
                }
            }
        }
    },
    data: function() {
        return {
            acumulados: [],
            grafico_benchmark:null,
            size: 12,
            indices:'',
            acumulado:'',
            quantidade_meses: 'Ult. 12 meses',
            lista_quantidade_meses: ['Ult. 12 meses','Ult. 24 meses','Ult. 36 meses','Ult. 48 meses','Ult. 60 meses']
        }
    },
    mounted() {
        this.alteraQuantidadeMeses(this.size)
    },
    watch: {
        quantidade_meses(newVal, oldVal) {            
            if (newVal !== oldVal) {
                this.size = parseInt(newVal.replace('Ult. ', '').replace(' meses', ''))
                this.alteraQuantidadeMeses(this.size)
            }            
        }
    },   
    methods: {
        alteraQuantidadeMeses(size) {
            //this.indices = this.dados.indices[0].valores.slice(0,this.size)
            this.calcularIndiceAcumulado(size)
            this.graficoBenchmark(size)
        },
        calcularIndiceAcumulado(size) {   
            this.acumulados = []
            for(var j = 0; j < this.dados.indices.length; j++) {
                let objeto = {}
                let res = 1
                let aux = 1
                objeto.nome = this.dados.indices[j].nome
                objeto.cor = `color:${this.dados.indices[j].cor}`
                // console.log(`this.dados.indices[${j}]:`,this.dados.indices[j])
                this.indices = this.dados.indices[j].valores.slice(0,size)
                // console.log('this.indices:',this.indices)
                for(var i = 0; i < this.indices.length; i++) {
                    aux = this.indices[i].indice / 100 + 1
                    res *= aux
                }
                objeto.indice = parseFloat((res -1)*100).toFixed(2).toString().replace('.',',')
                //console.log('objeto:',objeto)
                this.acumulados.push(objeto)
            }
            //this.acumulado = parseFloat((res -1)*100).toFixed(2).toString().replace('.',',')
            //console.log('this.acumulados:',this.acumulados)
        },
        graficoBenchmark(size) {
            //console.log('size',size)
            let grafico = new Object()
            let arr = new Array()
            let labels = new Array()
            for(var i = 0; i <= this.dados.indices.length - 1; i++) {
                let auxReg = this.dados.indices[i].valores.slice(0, size)
                if(i == 0) {
                    for(var j = auxReg.length - 1; j >= 0; j--) {
                        labels.push(auxReg[j].anomes)
                    }
                }
                let auxData = new Object()
                auxData.label = this.dados.indices[i].nome
                auxData.backgroundColor = this.dados.indices[i].cor
                auxData.borderColor = this.dados.indices[i].cor
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
            //console.log('this.grafico_benchmark',this.grafico_benchmark)
        }
    },
}