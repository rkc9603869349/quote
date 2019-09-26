//#region : Variables
var fs = require('fs');
var util = require('util'); 
var request = require('request');
var eventLogger = require('./Helper/EventLogger.js');
//var path=require('path');
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
var hoteldata=[];
var flightdata=[];
var restaurantdata=[];
var rentalcardata=[];
var eventdata=[];
var orderdata=[];
var userdata=[];
var invoicedata=[];
var UserID=[];
var objEventLogger;
//#endregion

//#region Classes creation
class GoogleEvents{
    constructor(context,type,reservationNumber,reservationStatus,name,event,quoteamount,filelength){
        if(typeof(context)!='undefined' ){
            this.context=context;
        }
        if(typeof(type)!='undefined'){
            this.type=type;
        }
        if(typeof(reservationNumber)!='undefined'){
            this.reservationNumber=reservationNumber;
        }
        if(typeof(reservationStatus)!='undefined'){
            this.reservationStatus=reservationStatus;
        }
        if(typeof(name)!='undefined'){
            this.name=name;
        }
        if(typeof(event)!='undefined'){
            this.event=event;
        }
        if(typeof(quoteamount)!='undefined'){
            this.QuoteAmount = parseInt(String(quoteamount).replace("$","")) *filelength;
        }        
        if(objEventLogger.EventType == type){
            this.IsSent=false;
        }else{
            this.IsSent=true;
        }
        
    }
}
class FlightEvent extends GoogleEvents{
    constructor(jsonContent,filelength){
       // var issent=false;
        
        super(jsonContent['@context'], jsonContent['@type'],jsonContent.reservationNumber, jsonContent.reservationStatus,jsonContent.underName.name,jsonContent.reservationFor['@type'],jsonContent['BookedAmount'],filelength);
        this.flightnumber=jsonContent.reservationFor.flightNumber;
        this.airLine=jsonContent.reservationFor.airline.name;
        this.departureAirport=jsonContent.reservationFor.departureAirport.iataCode ;
        this.departureTime=DataTimeFormatting(jsonContent.reservationFor.departureTime);
        this.arrivalAirport=jsonContent.reservationFor.arrivalAirport.iataCode;
        this.arrivalTime=DataTimeFormatting(jsonContent.reservationFor.arrivalTime );        
    }
   
}

class HotelEvent extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],jsonContent.reservationNumber, jsonContent.reservationStatus,jsonContent.underName.name,jsonContent.reservationFor['@type'],jsonContent['BookedAmount'],filelength);
        this.Hotel=jsonContent.reservationFor.name;
        this.addres=jsonContent.reservationFor.address.addressLocality ;
        this.addressLocality=jsonContent.reservationFor.address.streetAddress;
        this.telephone=jsonContent.reservationFor.telephone ;
        this.checkinDate=DataTimeFormatting(jsonContent.checkinDate);
        this.checkoutDate=DataTimeFormatting(jsonContent.checkoutDate);

    }
}
class RestaurantEvent extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],jsonContent.reservationNumber, jsonContent.reservationStatus,jsonContent.underName.name,jsonContent.reservationFor['@type'],jsonContent['BookedAmount'],filelength);
        this.Restaurant=jsonContent.reservationFor.name;
        this.addres=jsonContent.reservationFor.address.addressLocality ;
        this.addressLocality=jsonContent.reservationFor.address.streetAddress;
        this.startTime=DataTimeFormatting(jsonContent.startTime);
        this.partySize=jsonContent.partySize;
        

    }
}
class RentalCarEvent extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],jsonContent.reservationNumber, jsonContent.reservationStatus,jsonContent.underName.name,jsonContent.reservationFor['@type'],jsonContent['BookedAmount'],filelength);
        this.rentalCompanyname=jsonContent.reservationFor.rentalCompany.name;
        this.pickupLocation=jsonContent.pickupLocation.name;
        this.pickupAddress=jsonContent.pickupLocation.address.streetAddress;
        this.pickupAddresslocality=jsonContent.pickupLocation.address.addressLocality;
        this.pickupTime=DataTimeFormatting(jsonContent.pickupTime);
        this.dropoffLocation=jsonContent.dropoffLocation.name;
        this.dropoffAddress=jsonContent.dropoffLocation.address.streetAddress;
        this.dropoffAddresslocality=jsonContent.dropoffLocation.address.addressLocality;
        this.dropoffTime=DataTimeFormatting(jsonContent.dropoffTime);
    }
}
class Event extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],jsonContent.reservationNumber, jsonContent.reservationStatus,jsonContent.underName.name,jsonContent.reservationFor['@type'],jsonContent['BookedAmount'],filelength);
        this.startdate=DataTimeFormatting(jsonContent.reservationFor.startDate);
        this.locationName=jsonContent.reservationFor.location.name;
        this.streetAddress=jsonContent.reservationFor.location.streetAddress;
        this.addressLocality=jsonContent.reservationFor.location.addressLocality;
        this.addressregion=jsonContent.reservationFor.location.addressRegion;
        this.postalcode=jsonContent.reservationFor.location.postalCode;
        this.addressCountry=jsonContent.reservationFor.location.addressCountry;
        this.venueSeat=jsonContent.venueSeat;
        this.venueRow=jsonContent.venueRow;
        this.ticketToken=jsonContent.ticketToken;
        this.ticketNumber=jsonContent.ticketNumber;
    }
}
class Order extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],undefined,undefined,jsonContent.merchant.name,undefined ,jsonContent.acceptedOffer.price,filelength);
        this.orderNumber=jsonContent.orderNumber;
        this.priceCurrency=jsonContent.priceCurrency;
        this.itemOffered=jsonContent.acceptedOffer.itemOffered.name;
    }
}
class Invoice extends GoogleEvents{
    constructor(jsonContent,filelength){
        super(jsonContent['@context'], jsonContent['@type'],undefined,undefined,undefined,undefined,jsonContent.totalPaymentDue.price,filelength);
        this.accountId=jsonContent.accountId; 
        this.paymentDueDate=DataTimeFormatting(jsonContent.paymentDue);
        this.paymentStatus=jsonContent.paymentStatus;
        this.providerName=jsonContent.provider.name;
        this.minPaymentDueAmount=jsonContent.minimumPaymentDue.price;
    }
}

class User
{
    constructor(hoteldata,flightdata,restaurantdata,rentalcardata,eventdata,orderdata,invoicedata)
    {       
        if( typeof(hoteldata)!="undefined"){
            this.Hotel=hoteldata;           
        }
        if( typeof(flightdata)!="undefined"){
            this.Flight=flightdata;           
        }
        if( typeof(restaurantdata)!="undefined"){
            this.Restaurant=restaurantdata;            
        }
        if( typeof(rentalcardata)!="undefined"){
            this.RentalCarData=rentalcardata;            
        }
        if( typeof(eventdata)!="undefined"){
            this.EventData=eventdata;            
        }
        if( typeof(orderdata)!="undefined"){
            this.OrderData=orderdata;            
        }
        if( typeof(invoicedata)!="undefined"){
            this.InvoiceData=invoicedata;            
        }
    }    
}

//#endregion

//user datetime formating converting  YYYY-MM-DDTHH:MM:SS-MS:MS to MM/DD/YYYY hh:mm 
function DataTimeFormatting(inputdate)
{
    var date=inputdate.split('T')[0]
    date=date.split('-')[1]+"/"+date.split('-')[2]+"/"+date.split('-')[0]
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
    //return date+" "+time;
}

//TBD - Call new Quote APIs
async function fnQuoteAmount(length)
{     
    
     return (await axios({
        method: 'post',
        url: 'http://localhost:8089/quoteapi',
        data: String(length)
      }))
}
//finding event and creating object for eventtype and adding object to relevant list
function CreateModel(jsonContent,filelength)
{    
    if(jsonContent['@type'] == "LodgingReservation")
    {
        var temp_Hoteldata=new HotelEvent(jsonContent,filelength)
        UserID.push(temp_Hoteldata.UserId)
        hoteldata.push(temp_Hoteldata);   
    }
    else if(jsonContent['@type'] == "FlightReservation")
    {
        var temp_FlightData=new FlightEvent(jsonContent,filelength);
        UserID.push(temp_FlightData.UserId);
        flightdata.push(temp_FlightData);
    }
    else if(jsonContent['@type'] == "RentalCarReservation")
    {
        var temp_RentalCar=new RentalCarEvent(jsonContent,filelength);
        UserID.push(temp_RentalCar.UserId);
        rentalcardata.push(temp_RentalCar);
        
    }else if(jsonContent['@type'] == "FoodEstablishmentReservation")
    {
        var temp_RestaurantData=new RestaurantEvent(jsonContent,filelength);
        UserID.push(temp_RestaurantData.UserId);
        restaurantdata.push(temp_RestaurantData);
    }else if(jsonContent['@type'] == "EventReservation")
    {
        var temp_EventData=new Event(jsonContent,filelength);
        UserID.push(temp_EventData.UserId);
        eventdata.push(temp_EventData);
    }else if(jsonContent['@type'] == "Order")
    {
        var temp_OrderData=new Order(jsonContent,filelength);
        UserID.push(temp_OrderData.UserId);
        orderdata.push(temp_OrderData);
    }else if(jsonContent['@type'] == "Invoice")
    {
        var temp_InvoiceData=new Invoice(jsonContent,filelength);
        UserID.push(temp_InvoiceData.UserId);
       invoicedata.push(temp_InvoiceData);
    }
}

function UserModel(hoteldata,flightdata,restaurantdata,carrentaldata,eventdata,orderdata,invoicedata)
{
    //get unique userid
    //let unique = UserID.filter((item, arr, ar) => ar.indexOf(item) === arr);  
    //get unique userid data from user array
    var uniqueSizedData=UserID.filter((item, arr, ar) => ar.indexOf(item) === arr);   
    var temp;

    for(temp=0;temp<uniqueSizedData.length;temp++)
    {
        var hoteldataindex="";
        var flightSearchedIndex="";
        var restaurantSearchedIndex="";
        var carRentalSearchedIndex="";
        var eventdataindex="";
        var orderdataindex="";
        var invoicedataindex="";
        //checking if there is relevent user in flight equal to hotel                  
        if(hoteldata.some(data=>data.UserId == uniqueSizedData[temp]))
         {
            hoteldataindex=hoteldata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        if(flightdata.some(data=>data.UserId == uniqueSizedData[temp]))
        {
            flightSearchedIndex=flightdata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        //checking if there is relevent user in restaurant equal to hotel
        if(restaurantdata.some(data=>data.UserId == uniqueSizedData[temp]))
        {
            restaurantSearchedIndex=restaurantdata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        //checking if there is relevent user in car rental equal to hotel
        if(carrentaldata.some(data=>data.UserId == uniqueSizedData[temp])){
            carRentalSearchedIndex=carrentaldata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        if(eventdata.some(data=>data.UserId == uniqueSizedData[temp])){
            eventdataindex=eventdata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        if(orderdata.some(data=>data.UserId == uniqueSizedData[temp])){
           orderdataindex=orderdata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
        }
        if(invoicedata.some(data=>data.UserId == uniqueSizedData[temp])){
            invoicedataindex= invoicedata.map(function(e) { return e.UserId; }).indexOf(uniqueSizedData[temp]);
         }
        //creating user object and adding to user list
        userdata.push(new User(hoteldata[hoteldataindex],flightdata[flightSearchedIndex],restaurantdata[restaurantSearchedIndex],rentalcardata[carRentalSearchedIndex],eventdata[eventdataindex],orderdata[orderdataindex],invoicedata[invoicedataindex]));
    }
    // Return the final resultset    
    return userdata;
}

//#region : Exclude the other files if any in the directory * <Userid_Event_LOC_StartDate>
function isDataFile(filename) 
{
  objEventLogger
  // Split the extension and get the full filename  
  let fnString = filename.split('.')[0]; 
  //Split the Event details for the user 
  return (filename.split('.')[1] == 'json' 
          && fnString.split('_')[0]== objEventLogger.UserName              //James is hardcoded value
          && (fnString.split('_')[1] == 'FoodEstablishmentReservation'  //Restuarant
          || fnString.split('_')[1] == 'LodgingReservation'             //Hotel
          || fnString.split('_')[1] == 'RentalCarReservation'           //RentalCar
          || fnString.split('_')[1] == 'FlightReservation'              //Flight
          || fnString.split('_')[1] == 'EventReservation'               //Event
          || fnString.split('_')[1] == 'Order'                          //order
          || fnString.split('_')[1] == 'Invoice')                       //Invoice
          && fnString.split('_')[2] == objEventLogger.EventDate 
          &&  fnString.split('_')[3] == objEventLogger.EventLoc
         );
}

async function GetFileList()
{
    var arrFileList = [];
    console.log("GetFileList Started !!!");
    await bucket.getFilesStream().on('error', console.error).on('data', async function(file) 
    {       
        arrFileList.push(file.name);
     })
    .on('end', async function() 
    {
        console.log("GetFileList Final List: " + arrFileList)
    });
    return arrFileList;
}
//#endregion 
async function listFiles() 
{
    var arrFilenames = [];
    console.log("listFiles started");       
    bucket.getFiles(async function (err, files) 
    {
        console.log("1");
        if (!err) 
        {
            console.log("2");
            files.forEach(file => 
            {
                arrFilenames.push(file.name);
            });
            arrFilenames = arrFilenames.filter(isDataFile);
            var filelength="";
            await fnQuoteAmount(arrFilenames.length).then(function(res){
                filelength=parseFloat(res.data)
            
            console.log("Filtered file list : " + arrFilenames)
            files.forEach(file => 
            { 
                if (arrFilenames.includes(file.name)) 
                {  
                    file.download(function (err, contents) 
                    {
                        console.log("Downloaded Filename : " + file.name);              
                        CreateModel(JSON.parse(contents),filelength);
                    });
                }
            });  
            })          
        }
    });
    console.log("listFiles Ends");
    return arrFilenames;
}

//#region - PAGE_LOAD Read all json files in the directory, filter out those needed to process, 
async function ProcessEvent(req, res, pEventLogger)
{    
    hoteldata=[];
    flightdata=[];
    restaurantdata=[];
    rentalcardata=[];
    userdata=[];
    eventdata=[];
    orderdata=[];
    invoicedata=[];
    UserID=[];
    objEventLogger = pEventLogger;
    console.log("ProcessEvent started !!!")
    await listFiles().then(async function()
    {
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log("Inside Listfiles loop !!!")
        //appending different data to user filter and making user array out of it
        var finalobj = UserModel(hoteldata,flightdata,restaurantdata,rentalcardata,eventdata,orderdata,invoicedata);
        if(finalobj.length==0)
        {
            console.log("No Data for "+ objEventLogger.UserName);
        }    
        //final writing of object_userdata to json file for each user
        var filename = "";         
        for(var arr=0; arr<finalobj.length; arr++)
        {
            //geting userid  and creating filename
            filename = "" + finalobj[arr].UserIdval +"";
            // Output            
            var jsonString = JSON.stringify(finalobj[arr]).replace("User","").replace("Id","UserId").replace("{","{"+'"UserId":'+'"'+objEventLogger.UserName+'",').replace(/`/g,"") 
             // Send quote reponse API
             res.send(JSON.parse(jsonString));   
        }    
    });
    console.log("ProcessEvent Ends !!!")
}
module.exports = ProcessEvent;
//#endregion