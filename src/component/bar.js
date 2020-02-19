import '../../node_modules/chart.js';
import VueCharts from '../../node_modules/vue-chartjs';
import { Bar } from '../../node_modules/vue-chartjs';  

export default {
    template: 'bar',
    extends: Bar,
    data: () => ({
        chartdata: {
            labels: ['January', 'February'],
            datasets: [
                {
                    label: 'Data One',
                    backgroundColor: '#f87979',
                    data: [40, 20]
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    }),
    mounted () {
        this.renderChart(this.chartdata, this.options)
    }
}