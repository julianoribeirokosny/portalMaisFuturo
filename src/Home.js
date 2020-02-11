'use strict';

import $ from 'jquery';
import firebase from 'firebase/app';
import 'firebase/auth';
import {MaterialUtils} from './Utils';
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

    //this.firebaseHelper.

    // Clear previously displayed posts if any.
    //this.clear();

    // Listen for posts deletions.
    this.firebaseHelper.registerForPostsDeletion((postId) => this.onPostDeleted(postId));

    // Load initial batch of posts.
    const data = await this.firebaseHelper.getPosts();
    // Listen for new posts.
    const latestPostId = Object.keys(data.entries)[Object.keys(data.entries).length - 1];
    this.firebaseHelper.subscribeToGeneralFeed(
        (postId, postValue) => this.addNewPost(postId, postValue), latestPostId);

    //VUE.JS Configurações
    const data_Home = {
                        "usuarioId": "02405789965",
                        "nome": "JULIANO RIBEIRO KOSNY",
                        "apelido": "Juliano",
                        "mensagem": "Seu projeto de vida está de vento em popa!",
                        "campanhas": [{
                            "nome": "Emprestimos",
                            "icone": "face",
                            "titulo": "Há uma oportunidade especial disponível para você!",
                            "descricao": "Você tem R$ 8.500,00 pré aprovado para emprestimo consiente.",
                            "ativo": true,
                            "card_background": "background-image: linear-gradient(114deg, #033166 0%, #1779C6 100%);",                            
                            "card_button_left": "background-color: #D3D3D3; color:white;",
                            "card_button_right": "background-color: #1865AF; color:white;"
                          },
                          {
                            "nome": "Aporte",
                            "icone": "attach_money",
                            "titulo": "As taxas de aporte estão mais vantajosas esse mês.",
                            "descricao": "Aumentando o valor do seu aporte a taxa será de 0,5%.",
                            "ativo": false,
                            "card_background": "background-image: linear-gradient(114deg, #033166 0%, #1779C6 100%);",
                            "card_button_left": "background-color: #D3D3D3; color:white;",
                            "card_button_right": "background-color: #1865AF; color:white;"
                          }
                        ],
                        "saldo_reserva": {
                          "grafico": {
                            "labels": ["Patronal", "Funcional"],
                            "data": [ 28523.30, 6104.80 ],
                            "backgroundColor": ["#8ACE7B", "#1779C6"],
                            "borderWidth": 6,
                            "borderColor": "#FFFFFF",                            
                          },
                          "total": "34.628.10",
                          "patronal": "28.523,30",
                          "funcional": "6.104,80"
                        },
                        "projeto_vida": {
                          "grafico": {
                            "labels": ["Jan", "Fev", "Mar", "Hoje", "Mai", "65 anos"],
                            "datasets": [{
                                "data": [281690.10, 281690.10, 281690.10, 281690.10, 281690.10, 281690.10],
                                "label": "Cobertura por morte",
                                "borderColor": "#3e95cd",
                                "fill": false
                              },
                              {
                                "data": [402415.26, 402415.26, 402415.26, 402415.26, 402415.26, 402415.26],
                                "label": "Cobertura por invalidez",
                                "borderColor": "#8e5ea2",
                                "fill": false
                              },
                              {
                                "data": [0, 7000.45, 14780.90, 22500.45, 29000.32, 45321.56],
                                "label": "Reserva",
                                "borderColor": "#3cba9f",
                                "fill": false
                              }
                            ]
                          }
                        },
                        "cobertura_atual": "R$ 535.789,92",
                        "renda_projetada": "R$ 2.115,45",
                        "reserva_projetada": "R$ 835 mil",
                        "acao_renda": {
                          "renda_potencial": "R$ 3.000,00",
                          "reserva_potencial": "R$ 1 mi",
                          "card_background": "background-image: linear-gradient(-90deg, #136cb5, #033166);"
                        },
                        "coberturas": {
                          "minhas_coberturas": [{
                            "nome": "Cobertura por morte",
                            "valor": "R$ 281.690,10"
                          }, {
                            "nome": "Cobertura por invalidez",
                            "valor": "R$ 402.415,26"
                          }],
                          "acao_cobertura": {
                            "card_background": "background-image: linear-gradient(-90deg, #136cb5, #033166);",
                            "descricao": "Expanda sua cobertura para R$ 1mi"
                          }
                        },
                        "contribuicao": {
                          "grafico": [{
                            "data": [178.70, 40.96, 47.56, 32.78],
                            "backgroundColor": ["#033166", "#1779c6", "#ffec74", "#8ace7b"],
                            "borderWidth": 6,
                            "borderColor": "#FFFFFF",
                            "label": "Dataset 1"
                          }],
                          "minha_contribuicao": [{
                              "nome": "Contribuição total",
                              "valor": "R$ 300,00"
                            },
                            {
                              "nome": "maisfuturo previdência",
                              "valor": "R$ 178,70"
                            },
                            {
                              "nome": "Cobertura | morte",
                              "valor": "R$ 40,96"
                            },
                            {
                              "nome": "Cobertura | invalidez",
                              "valor": "R$ 47,56"
                            },
                            {
                              "nome": "maisfuturo reserva",
                              "valor": "R$ 32,76"
                            }
                          ],
                          "acao_contribuicao": {
                            "card_background": "background-image: linear-gradient(-90deg, #136cb5, #033166);",
                            "descricao": "Com mais R$ 25,00 por mês você pode deduzir R$ 450,00 do seu IR"
                          }
                        },
                        "mais_amigos": {
                          "card_background": "background-image: linear-gradient(-90deg, #136cb5, #033166);"
                        },
                        "educacao_financeira": {}
                      };

    console.log('data_Home',data_Home);

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
          toggle: false,          
          provider: {           
            context: null
          }
        },
        methods: {          
          toggleCategory: function() {
            this.toggle = !this.toggle;
          },
          removerCampanha: function(campanha) {
              campanha.ativo = false;
          },
          contratarCampanha: function(campanha) {
              console.log("Contratar Campanha", campanha);
          }          
        }
    });
  }
}


