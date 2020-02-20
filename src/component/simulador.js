import 'vue-range-component/dist/vue-range-slider.css';
import VueRangeSlider from 'vue-range-component';

require('./simulador.css');

export default {    
    props: ['dados'],
    components: { VueRangeSlider },    
    data: function () {
        return {
            valor: "15",    
            principal: "3500"
        }
    },    
    template: require('./simulador.html'),    
    methods: {        
    },
}