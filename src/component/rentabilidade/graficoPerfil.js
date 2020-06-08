import { Doughnut } from 'vue-chartjs';

export default {
    extends: Doughnut,
    props: {
        chartdata: ''
    },
    watch: {
        chartdata(val) {
            console.log('chartdata Perfil', val)
            this.renderChart({
                labels: val.labels,
                datasets: [{
                    data: val.data,
                    backgroundColor: val.backgroundColor,
                    borderColor: "#FFFFFF",
                    borderWidth: "6",
                }]
            }, {
                cutoutPercentage: 88,
                legend: false
            })
        }
    }
}