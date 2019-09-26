'use strict';

const express = require('express');
const app = express();
const jSONParser = require("body-parser");
var eventLogger = require('./Helper/EventLogger.js');

app.use(jSONParser.urlencoded({extended : true}));
app.use(express.json())
app.use(express.json({
    inflate: true,
    limit: '900kb',
    reviver: null,
    strict: true,
    type: 'application/json',
    verify: undefined
  }))

app.post('/event', function(eventReq, eventRes) 
{
  const objEventLogger = new eventLogger();    
  // Parse input Json and Save
  console.log("App Started !!!")
  objEventLogger.eventParser(eventReq.body, eventReq, eventRes, objEventLogger);  
  // Get Quote API 
  console.log("App Ends !!!") 
})  

app.get('/', (req, res) => {
  res
    .status(200)
    .send(' Welcome to Chubb NLQuote!')
    .end();
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});

module.exports = app;
