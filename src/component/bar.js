import { Bar } from '../../node_modules/vue-chartjs';
 
export default {
    extends: Bar,
    props: ['chartdata'],
    // props: {
    //     dataSet: Object
    // },
    mounted () {
        // Overwriting base render method with actual data.
        this.renderChart(this.chartdata, this.options)
        // this.renderChart(this.dataSet);
        //  {
        //   labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        //   datasets: [
        //     {
        //       label: 'GitHub Commits',
        //       backgroundColor: '#f87979',
        //       data: [40, 20, 12, 39, 10, 40, 39, 80, 40, 20, 12, 11]
        //     }
        //   ]
        // }    
    }
}