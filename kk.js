const axios = require('axios');
async function fnQuoteAmount(length)
{     
    
     return (await axios({
        method: 'post',
        url: 'http://localhost:8089/quoteapi',
        data: String(length)
      }))
}
async function waiting(length){
    //var bookedAmt = parseInt(String(bookedAmt).replace("$","")) ;
     k = await fnQuoteAmount(length)//.then(function(req){return req})
     return k;
    //console.log(k)
}
//console.log(waiting(2))
class A{
    constructor(value1){
        this.value=value1;
    }
     
}
//var zz= new A(20,1)
//console.log(zz)

async function pp(value1,value2){
    var filelen=""
   await fnQuoteAmount(value2).then(function(res){
       filelen=new A(parseFloat(res.data))// * parseInt(String(value1).replace("$",""))))
      console.log(filelen)
       console.log()
   })
  
}
pp("$20",2)