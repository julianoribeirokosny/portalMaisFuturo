import VueCharts from 'vue-chartjs';

export default {    
    extends: VueCharts.Doughnut,
    props: {
        dados: ''
    },
    data: function() {
        return {
            percentualPago: 0,
            arrayData: []
        }
    },
    created(){
        this.percentualPago = this.dados.data
        this.arrayData = [ this.percentualPago, 100 - this.percentualPago ]
    },
    mounted() {
        this.renderChart({
            // labels: data_Home.saldo_reserva.grafico.labels,
            datasets: [{
                data: this.arrayData,
                backgroundColor: ["#033166", "#487bb5", "6fa0d9", "91b8e6"],
                borderWidth: 4,
                borderColor: "#FFFFFF",
            }]
        }, {
            cutoutPercentage: 88,
            legend: false,
            tooltips: false,
        });
    }
}
