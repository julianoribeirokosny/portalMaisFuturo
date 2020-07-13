import { Doughnut } from 'vue-chartjs';

export default {    
    extends: Doughnut,
    props: {
        chartdata: null
    },
    mounted(){        
        if(this.chartdata) {
            this.renderChart({
                labels: this.chartdata.label,
                datasets: [{
                    data: this.chartdata.data,
                    backgroundColor: this.chartdata.backgroundColor,
                    borderWidth: this.chartdata.borderWidth,
                    borderColor: this.chartdata.borderColor,
                }]
            }, {
                cutoutPercentage: 88,
                responsive: true,
                legend: false,
                tooltips: false,
                rotation: 1 * Math.PI,
                circumference: 1 * Math.PI
            })
        }
    },
    // watch: {
    //     chartdata(val) {
    //         this.renderChart({
    //             labels: val.label,
    //             datasets: [{
    //                 data: val.data,
    //                 backgroundColor: val.backgroundColor,
    //                 borderWidth: val.borderWidth,
    //                 borderColor: val.borderColor,
    //             }]
    //         }, {
    //             cutoutPercentage: 88,
    //             responsive: true,
    //             legend: false,
    //             tooltips: false,
    //             rotation: 1 * Math.PI,
    //             circumference: 1 * Math.PI
    //         })
    //     }
    // }
}