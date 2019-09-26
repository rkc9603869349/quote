'use strict';
const express = require('express');
const quoteApi = express();
const jSONParser = require("body-parser");
quoteApi.use(jSONParser.text({type: '*/*'}));
quoteApi.post('/quoteapi', function(eventReq, eventRes) 
{
  console.log("QuoteAPI starts")
   console.log(eventReq.body)
  	var temp=parseInt(eventReq.body)
   var quotepercentage=1.0-(temp)*0.0125
  quotepercentage=parseFloat(quotepercentage).toFixed(5)
  console.log(quotepercentage)
  if(quotepercentage>0)
  { 
    eventRes.status(200)
    .send("\""+ quotepercentage +"\"")
    .end();
    console.log("App Ends !!!") 
 }else{

 }
 console.log("QUOTE API ENds")
}
  
)  

quoteApi.get('/', (req, res) => {
  res
    .status(200)
    .send(' Welcome to Chubb NLQuote API!')
    .end();
});

// Start the server
const PORT = process.env.PORT || 8089;
quoteApi.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

//module.exports = quoteApi;
