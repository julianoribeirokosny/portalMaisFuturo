'use strict';

//import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
//import {MaterialUtils} from './Utils';
import '../node_modules/chart.js';
import VueCharts from 'vue-chartjs';
import { Bar, Line, Doughnut } from 'vue-chartjs';

/**
 * Handles the Home UI.
 */
export default class Home {
  /**
   * Inicializa a Home do POrtal MaisFuturo
   * @constructor
   */
  constructor(firebaseHelper) {
    this.firebaseHelper = firebaseHelper;

    // Firebase SDK.
    this.auth = firebase.auth();
  }

  async showHome() {

    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //TODO: ABAIXO, CRIAR TRIGGER PARA MUDANÇA NOS CARDS!!!!!!!!!!!!!!!!!
    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
      
    const data_Home = await this.dadosHome('1234567890')    
    console.log("data_Home",data_Home);

    Vue.component('grafico-reserva', {
        extends: VueCharts.Doughnut,        
        template: '#grafico-reserva',
        mounted () {
            this.renderChart({              
                              labels: data_Home.saldo_reserva.grafico.labels,
                              datasets: [{
                                  data: data_Home.saldo_reserva.grafico.data,
                                  backgroundColor: data_Home.saldo_reserva.grafico.backgroundColor,
                                  borderWidth: data_Home.saldo_reserva.grafico.borderWidth,
                                  borderColor: data_Home.saldo_reserva.grafico.borderColor,
                              }]
                            },
                            {
                                cutoutPercentage: 88,
                                responsive: true,
                                legend: false
                            }
              )
        }
    });

    var app = new Vue({
      el: '#app',        
      data: {      
        home: data_Home,
        toggle: false
      },
      methods: {          
        toggleCategory: function() {
          this.toggle = !this.toggle;
        },
        removerCampanha: function(campanha) {
            campanha.ativo = false;
        }
      }
    });
  }

  dadosHome(uid) {
    let home = null
    return this.firebaseHelper.getHome().then((data) => {
      if (data) {
        home = data
        return this.firebaseHelper.getUser(uid)
      } else {
        return null;
      }
    }).then((user) => {
      if (user===null) {
        return null
      }
      // MERGE HOME e DADOS USUÁRIOS
      let stringHome = JSON.stringify(home)
      while (stringHome.indexOf('<<') >= 0) {
        console.log('JSON.parse(stringHome)', JSON.parse(stringHome))
        let posIni = stringHome.indexOf('<<')
        let posFim = stringHome.indexOf('>>')
        let chave = stringHome.substring(posIni+2, posFim)
        let caminho = chave.split('.')
        console.log('chave', chave)
        console.log('caminho', caminho)
        let valor = user
        for (let i in caminho) {
          if (valor[caminho[i]]) {
            valor = valor[caminho[i]]
          }
        }

        if (stringHome.indexOf('<<'+ chave + '>>') < 0) {
          stringHome = stringHome.replace('"<<'+ chave + '>>"', 0)
        } else if (typeof valor === "object") {
          valor = JSON.stringify(valor)
          stringHome = stringHome.replace('"<<'+ chave + '>>"', valor)     
        } else {
          stringHome = stringHome.replace('<<'+ chave + '>>', valor)           
        }
      }
      console.log('stringHome final', JSON.parse(stringHome)) 
      return JSON.parse(stringHome)
    });
  }
}

