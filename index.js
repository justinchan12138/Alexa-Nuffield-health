'use strict';
const AWS = require("aws-sdk");
AWS.config.update({
        region: "eu-west-1",
    });
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = function(event,context) {
    
    try {
  
    var request = event.request;
    var session = event.session;
    
     if(!event.session.attributes) {
      event.session.attributes = {};
    }
    
    if (request.type === "LaunchRequest") {
        let options = {};
        options.speechText = "Welcome to Nuffield Health. You can use this application to manage your appointments. How can I help you";
        options.endSession = false;
        context.succeed(buildResponse(options));
        
    }
    else if (request.type === "IntentRequest" ) {
        let options = {};
        options.session = session;
        
        if (request.intent.name === "MakeBookingStepOneIntent") {
        options.speechText = "Sure. Can you please specify the time and date of the appointment? ";
        options.session.attributes.MakeBookingStepOneIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }
        
        else if (request.intent.name === "MakeBookingStepTwoIntent") {
            
        if (session.attributes.MakeBookingStepOneIntent) {
        var date = request.intent.slots.date.value;
        var time = request.intent.slots.time.value;
        if (date != undefined && time != undefined) {
        
        var params = {
        TableName: "Nuffield_Health",
        KeyConditionExpression: "ID = : 1", 
        ExpressionAttributeNames: {
            "#da": "date",
            "#ti": "time"
        },
        ExpressionAttributeValues: {
            ":d": date ,
            ":t": time
        },
        FilterExpression: "#da = :d AND #ti = :t" 
    };
           
        
        docClient.scan(params, function(err, data){
            if (err) {
                console.log(err);
                options.speechText = "There has been an error";
                options.endSession = true;
                context.succeed(buildResponse(options));
            } else {
                if(data.Count == 0){
                options.session.attributes.date = date;
                options.session.attributes.time = time;
                options.speechText = "Sure. There is an empty time slot on " + date + " at "  + time + ". Would you like me to make an appointment for you?";
                options.endSession = false;
                options.session.attributes.MakeBookingStepTwoIntent = true;
                context.succeed(buildResponse(options));
                } else {
                    // Something need to be improved here. We should give the user a list of things. 
                    console.log(data);
                options.speechText = "Sorry. The time slot you specified is not currently available";
                options.endSession = true;
                context.succeed(buildResponse(options));
                    
                }
            } 
            
        });
            
        }
        
        }
            else {
                options.speechText = "Wrong invocation of this intent";
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
        }
        
        else if (request.intent.name === "MakeBookingStepThreeIntent") {
        
        if (session.attributes.MakeBookingStepTwoIntent){
        
        var params = { 
            Item: {
                ID: 1,
                date: options.session.attributes.date,
                time: options.session.attributes.time
            },
            
            TableName: 'Nuffield_Health'
        };
        
           docClient.put(params,function(err, date){
            if (err) {
                console.log(err);
                options.speechText = "There has been an error";
                options.endSession = true;
                context.succeed(buildResponse(options));
                
            } else {
                options.speechText = "An appointment has been made Thank you for using Nuffield Health services. We look forward to seeing you";
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
    
        });
        }
            else {
                options.speechText = "Wrong invocation of this intent";
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
        }
        
        else if  (request.intent.name === "CancelStepOneIntent") {
        var params = {
        TableName: "Nuffield_Health",
        KeyConditionExpression: "ID = : 1"
        };
        
         docClient.scan(params, function(err, data){
            if (err) {
                console.log(err);
                options.speechText = "There has been an error";
                options.endSession = true;
                context.succeed(buildResponse(options));
            } else {
                options.speechText = "Sure. I have sent a list of your existing appointments on the alexa application on your phone. Which appointment would you like to cancel?";
                options.cardTitle = "Your existing bookings";
                console.log(data);
                var cardOutput = "";
                data.Items.forEach(function(item){
                    cardOutput += item.date + " --- " + item.time; 
                })
                options.cardContent = cardOutput;
                options.endSession = false;
                options.session.attributes.CancelStepOneIntent = true;
                context.succeed(buildResponse(options));
            } 
            
        });
        
        }
        
        else if  (request.intent.name === "CancelStepTwoIntent") {
        
        if (session.attributes.CancelStepOneIntent) {
            // make sure there is actually an appointment here
        let date = request.intent.slots.date.value;
        let time = request.intent.slots.time.value;
        options.speechText = "Sure. Just to confirm. You would like me to cancel the appointment on" + date + "at" + time + "Should I continue with the cancelation process?";
        options.session.attributes.CancelStepTwoIntent = true;
        options.session.attributes.date = date;
        options.session.attributes.time = time;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }}
        
        else if  (request.intent.name === "CancelStepThreeIntent") {
        if (session.attributes.CancelStepTwoIntent) {
        var date = options.session.attributes.date;
        var time = options.session.attributes.time;
        // cancel it in the database
        
        options.speechText = "No problem. The appointment has been cancelled. Thank you for using this application. We look forward to hearing from you soon ";
        options.endSession = true;
        context.succeed(buildResponse(options));
        }}
        
        else if  (request.intent.name === "QueryStepOneIntent") {
        
        var params = {
        TableName: "Nuffield_Health",
        KeyConditionExpression: "ID = : 1"
        };
        
         docClient.scan(params, function(err, data){
            if (err) {
                console.log(err);
                options.speechText = "There has been an error";
                options.endSession = true;
                context.succeed(buildResponse(options));
            } else {
                options.speechText = "Sure. I have sent a list of your existing appointments on the alexa application on your phone. Thank you for using our services";
                options.cardTitle = "Your existing bookings";
                console.log(data);
                var cardOutput = "";
                data.Items.forEach(function(item){
                    cardOutput += item.date + " --- " + item.time; 
                })
                options.cardContent = cardOutput;
                options.endSession = false;
                options.session.attributes.MakeBookingStepTwoIntent = true;
                context.succeed(buildResponse(options));
            } 
         });
            }
        
        else if  (request.intent.name === "QueryStepTwoIntent") {
        if (session.attributes.QueryStepOneIntent) {
            // this will not be necessary
        // TODO: Again, make queries in the database as we need information about the existing bookings. Depending on the structure on your database, I will convert the data and extract the dates and times, so that I can add them to the responce. An array would be a good choice here. 
        options.speechText = "you have in total three appointments. You have this this and that. Do you want me to repeat?";
        options.session.attributes.MakeBookingStepOneIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }}
        
        else if (request.intent.name == "AMAZON.CancelIntent") {
                options.speechText = "No Problem. The process has been cancelled. We look forward to hearing from you again. Good bye";
                options.endSession = true;
                context.succeed(buildResponse(options));
        }

        else {
            throw"unknown intent";
        }}
        
    
    else if (request.type === "SessionEndedRequest"){
        
    }
    else {
        throw"Unknown intent type";
    }


    

}catch (e) {
    context.fail("Exception:"+e);
}
}

function buildResponse(options) {
    
var response = {
    version: "1.0",
    response: {
    outputSpeech: {
      type: "PlainText",
      text: options.speechText
    },
    "shouldEndSession": options.endSession}
};
    if(options.repromText) {
        response.response.repromt = {
            outputSpeech: {
            type:"PlainText",
            text: options.repromptText
        }
        };
    }
    
    if(options.cardTitle) {
        response.response.card = { 
        type: "Simple",
        title: options.cardTitle ,
        content: options.cardContent
        }
    }
    
 
  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }
    return response;
}
