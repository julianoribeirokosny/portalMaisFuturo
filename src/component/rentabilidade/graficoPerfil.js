import { Doughnut } from 'vue-chartjs';

export default {
    extends: Doughnut,
    mounted() {  
        this.renderChart({              
            labels: ['Renda Fixa','Renda Variável','Empréstimo Pessoal'],
            datasets: [{
                data: [59.3, 38.2, 2.5],
                backgroundColor: ['#8ACE7B','#033166','#1779C6'],
                borderColor: "#FFFFFF",
                borderWidth: "6",                
            }]          
        }, {                  
            cutoutPercentage: 88,              
            legend: false
        })
    }
}