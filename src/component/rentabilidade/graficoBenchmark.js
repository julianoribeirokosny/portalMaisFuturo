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
                    tooltips:false,
                    legend:{
                        labels: {
                            boxWidth: 10,
                            boxHeight: 5,
                            fontSize: 9,
                            fontFamily:'MaisFuturo-regular',
                            letterSpacing:'-1 px'                            
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