'use strict';

module.exports =  {

    dateFormat : function (x, completo, soNumeros, dd_mm_yyyy) {

        if (!(x instanceof Date)) { //se String e não date... converte
            let dateParts = x.split('/')
            if (dateParts.length === 1) {
                dateParts = x.split('-')
                if (dateParts.length===1) {
                    return null //erro no formato de data de entrada: nem "-" nem "/" na formatação
                }
            }
            //se AAAA-MM-DD
            if (Number(dateParts[0]) > Number(dateParts[2])) {
                x = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]))
            } else {
                x = new Date(Number(dateParts[2]), Number(dateParts[1]) - 1, Number(dateParts[0]))
            }
        }

        let ret = ''
        let y = x.getFullYear().toString();
        let m = (x.getMonth() + 1).toString();
        let d = x.getDate().toString();
        let ho = x.getHours().toString();
        let mi = x.getMinutes().toString();
        let se = x.getSeconds().toString();
        
        (d.length == 1) && (d = '0' + d);
        (m.length == 1) && (m = '0' + m);
        (ho.length == 1) && (ho = '0' + ho);
        (mi.length == 1) && (mi = '0' + mi);
        (se.length == 1) && (se = '0' + se);

        if (soNumeros) {
            ret = y + m + d 
            if (completo) {
                ret += ho + mi + se
            }  
        } else {
            if (dd_mm_yyyy) {
                ret = d + '/' + m + '/' + y 
            } else {
                ret = y + '-' + m + '-' + d 
            }
            if (completo) {
                ret += ' ' + ho + ':' + mi + ':' + se
            }  
        }

        return ret
    },

    diffDatasEmHoras : function (dataMenor, dataMaior) {
        dataMenor = this.arruma_data(dataMenor)
        dataMaior = this.arruma_data(dataMaior)       
        const diff = Math.abs(dataMaior.getTime() - dataMenor.getTime()); // Subtrai uma data pela outra
        const horas = Math.trunc(diff / (1000 * 60 * 60 )); // Divide o total pelo total de milisegundos correspondentes a 1 hora. 
        return horas        
    },

    diffDatasEmDias : function (dataMenor, dataMaior) {
        dataMenor = this.arruma_data(dataMenor)
        dataMaior = this.arruma_data(dataMaior)       
        const diff = Math.abs(dataMaior.getTime() - dataMenor.getTime()); // Subtrai uma data pela outra
        const days = Math.trunc(diff / (1000 * 60 * 60 * 24)); // Divide o total pelo total de milisegundos correspondentes a 1 dia. (1000 milisegundos = 1 segundo).
        return days        
    },
    
    diffDatasEmMeses : function (dataMenor, dataMaior) {
        dataMenor = this.arruma_data(dataMenor)
        dataMaior = this.arruma_data(dataMaior)       
        let diminuiMes = dataMenor.getDate() > dataMaior.getDate() ? 1 : 0
        let months;
        months = (dataMaior.getFullYear() - dataMenor.getFullYear()) * 12;
        months -= dataMenor.getMonth();
        months -= diminuiMes
        months += dataMaior.getMonth();
        return months <= 0 ? 0 : months;        
    },

    diffDatasEmAnos : function (dataMenor, dataMaior) {
        dataMenor = this.arruma_data(dataMenor)
        dataMaior = this.arruma_data(dataMaior)    
        let anos = (dataMaior.getFullYear() - dataMenor.getFullYear())
        if (dataMaior.getMonth() < dataMenor.getMonth()) { //se não completou aniversário
            anos--
        }
        return anos <= 0 ? 0 : anos;        
    },

    idade_hoje(nascimento) {
        let hoje = new Date()
        var diferencaAnos = hoje.getFullYear() - nascimento.getFullYear();
        if ( new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()) < 
             new Date(hoje.getFullYear(), nascimento.getMonth(), nascimento.getDate()) )
            diferencaAnos--;
        return diferencaAnos;
    },

    arruma_data(data) {
        let hora = ''
        if (!(data instanceof Date)) {
            if (data.length > 11 && data.indexOf(':') > 0) { //se tem hora na data...
                hora = data.substring(data.indexOf(':') - 2)
                data = data.substring(0, data.indexOf(':') - 3)
            }
            let aData = data.split('/')
            if (aData.length <= 1) {
                aData = data.split('-')
            }
            let ano, mes, dia
            if (Number(aData[0]) > Number(aData[2])) { //entrou data no formato "AAAA-MM-DD"
                ano = aData[0]
                mes = aData[1]
                dia = aData[2]
            } else {
                ano = aData[2]
                mes = aData[1]
                dia = aData[0]
            }
            if (hora !== '') {
                let aHora = hora.split(':')
                data = new Date(
                    Number(ano), 
                    Number(mes) - 1, 
                    Number(dia), 
                    aHora[0] ? Number(aHora[0]) : 0,
                    aHora[1] ? Number(aHora[1]) : 0,
                    aHora[2] ? Number(aHora[2]) : 0)
            } else {
                data = new Date(Number(ano), Number(mes) - 1, Number(dia))
            }
            
        }
        return data
    }
}
