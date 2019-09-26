var ProcessEvent = require('../NL.js');
const express = require('express');
const fs = require('fs');
const jSONParser = require("body-parser");
var app = express();
// Cloud Storage Starts
const GOOGLE_CLOUD_PROJECT_ID = 'nlquote-chubbcts'; // Replace with your project ID
const GOOGLE_CLOUD_KEYFILE = './nlquote-chubbcts-service-key.json'; // Replace with the path to the downloaded private key
const DEFAULT_BUCKET_NAME = 'nlquote_bucket'; // Replace with the name of your bucket
// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');
// Creates a client
const storage = new Storage({
  projectId: GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: GOOGLE_CLOUD_KEYFILE,
});
const bucket = storage.bucket(DEFAULT_BUCKET_NAME)
// Cloud storage end 

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

class clsEventLogger
{ 
  constructor(UserName,EventType,EventDate,EventLoc) 
  {
    this.UserName = UserName;
    this.EventType = EventType;
    this.EventDate = EventDate;
    this.EventLoc = EventLoc;      
  }
  
  eventParser(evntCont, eventReq, eventRes,objEventLogger)  
  {    
      console.log("Event Parser started");
      if(evntCont.hasOwnProperty('@type'))
      {
         this.SaveEvent(evntCont, eventReq, eventRes, objEventLogger);
      }
      console.log("Event Parser Ended");
  }

  async SaveEvent(eventContent, eventReq, eventRes, objEventLogger)
  {
    console.log("SaveEvent Parser started");
    console.log(eventContent)
    this.EventType = eventContent['@type'];  
    if(eventContent['@type'] == "LodgingReservation")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.checkinDate);
      this.EventLoc = eventContent.reservationFor.address.addressRegion;
    }
    else if(eventContent['@type'] == "FlightReservation")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.reservationFor.arrivalTime);
      this.EventLoc = String(eventContent.reservationFor.arrivalAirport.name).split(' International Airport')[0];
    }
    else if(eventContent['@type'] == "RentalCarReservation")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.pickupTime);
      this.EventLoc = eventContent.pickupLocation.address.addressRegion;      
    }
    else if(eventContent['@type'] == "FoodEstablishmentReservation")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.startTime);
      this.EventLoc= eventContent.reservationFor.address.addressRegion;
    }else if(eventContent['@type'] == "EventReservation")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.reservationFor.startDate);
      this.EventLoc= eventContent.reservationFor.location.address.addressRegion;
    }else if(eventContent['@type'] == "Order")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.orderDate);
      this.EventLoc= eventContent.Location;
    }else if(eventContent['@type'] == "Invoice")
    {
      this.EventDate = this.DataTimeFormatting(eventContent.invoiceDate);
      this.EventLoc= eventContent.Location;
    }
    this.UserName = eventContent.UserId;  
    await this.WriteFile(this.UserName,this.EventType,this.EventDate,this.EventLoc, eventContent, eventReq, eventRes, objEventLogger); 
    console.log("SaveEvent Parser End");
  };

  async WriteFile(UserName, EventType, EventDate, EventLoc, eventContent, eventReq, eventRes, objEventLogger) 
  {
    console.log("Write file method started")
    var EventFile = this.UserName + '_' + this.EventType + '_' + this.EventDate + '_' + this.EventLoc + '.json';
    console.log(EventFile);
    const file = bucket.file(EventFile);
    try 
    {
      file.save(JSON.stringify(eventContent)).then(async function() 
      {
        console.log("Successfully save the file : " + EventFile);
        // Process the get the events
        console.log("ProcessEvent started in Write file method")
        await ProcessEvent(eventReq, eventRes, objEventLogger);
        console.log("ProcessEvent ends in Write file method")
      });
    } catch (err) {
      console.log("Error : Write file method  " + err)
    }
    console.log("Write file method Ends")
  };

  //user datetime formating converting  YYYY-MM-DDTHH:MM:SS-MS:MS to MM/DD/YYYY hh:mm 
  DataTimeFormatting(inputdate)
  {
    console.log("Event Logger "+"Entered Date Time Formatting")
      var date=inputdate.split('T')[0]
      date=date.split('-')[1]+"-"+date.split('-')[2]+"-"+date.split('-')[0]   
      if(inputdate.split('T')[1].includes('+'))
      {
          var time=inputdate.split('T')[1].split('+')[0]
          time=time.split(':')[0]+":"+time.split(':')[1]
      }
      else
      {
          var time=inputdate.split('T')[1].split('-')[0]
          time=time.split(':')[0]+":"+time.split(':')[1]
      }
      return date;
  };
}

module.exports = clsEventLogger;