'use strict';

export default {
    template: disclaimer, 
    methods: {
        closeModal(modal) {
            this.$refs[modal].style.display = "none";
        },
        openModal() {
            this.$refs[modal].style.display = "block";
        }
    },
}