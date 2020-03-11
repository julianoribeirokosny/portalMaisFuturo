import { Line } from 'vue-chartjs';

export default {    
    extends: Line,
    props: { 
        chartdata:'',
        options: {
             type: Object,
             default: () => { 
                 return {
                    responsive: true, 
                    maintainAspectRatio: false,
                    legend:{
                        labels: {
                            boxWidth: 25,
                            boxHeight: 5,
                            fontSize: 10,
                            fontFamily:'MaisFuturo-regular'
                        },
                        position:'bottom',
                        align:'center',
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                fontSize: 9,
                                color: '#3B3C3E',
                                callback: function(value) {                                    
                                      return value + '% ';
                                }                                      
                            },
                            gridLines: {
                                drawBorder: false,
                                
                            }
                        }],
                        xAxes: [{
                            ticks: {
                                fontSize: 9,
                                color: '#3B3C3E',     
                            },
                            gridLines: {
                                drawBorder: false,
                                display: false,
                            }
                        }]
                    }
                 }
             }
         }
    },
    watch: {
        chartdata(val) {     
            this.renderChart({ 
                labels: val.labels,
                datasets: val.dataset
            },
                this.options
            );
        }
    }    
}