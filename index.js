'use strict';
exports.handler = function(event,context) {
    try {
    var request = event.request;
    var session = event.session;
    
     if(!event.session.attributes) {
      event.session.attributes = {};
    }
    /* 3 types of requests
    i)   LaunchRequest      
    ii)  IntentRequest      
    iii) SessionEndedRequest  */
    
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
        let date = request.intent.slots.date.value;
        let time = request.intent.slots.time.value;
        
        
        // check database - return true if available, flase if not
        
        // if available
        
        options.speechText = "Sure. There is an empty time slot on" + date + "at"  + time + "Would you like me to make an appointment for you?";
        options.endSession = false;
        options.session.attributes.MakeBookingStepTwoIntent = true;
        context.succeed(buildResponse(options));
            
        /** if not available
        options.speechText = "An appointment has been made at" + time + "on"+ date;
        options.repromtText = "Is there anything that I can help you with?";
        options.endSession = false;
        context.succeed(buildResponse(options));**/
        }
            else {
                options.speechText = "Wrong invocation of this intent";
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
        }
        
        else if (request.intent.name === "MakeBookingStepThreeIntent") {
        
        if (session.attributes.MakeBookingStepTwoIntent){
        options.speechText = "An appointment has been made Thank you for using Nuffield Health services. We look forward to seeing you";
        options.endSession = true;
        context.succeed(buildResponse(options));
        }
            else {
                options.speechText = "Wrong invocation of this intent";
                options.endSession = true;
                context.succeed(buildResponse(options));
            }
        }
        
        else if  (request.intent.name === "CancelStepOneIntent") {
        // TODO: Make queries in the database as we need information about the existing bookings. Depending on the structure on your database, I will convert the data and extract the dates and times, so that I can add them to the responce. An array would be a good choice here. 
        options.speechText = "Sure. I am now making queries in the database. You have three appointments. They are on this, this and that";
        options.session.attributes.CancelStepOneIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }
        
        else if  (request.intent.name === "CancelStepTwoIntent") {
        
        if (session.attributes.CancelStepOneIntent) {
        let date = request.intent.slots.date.value;
        let time = request.intent.slots.time.value;
        options.speechText = "Sure. Just to confirm. You would like me to cancel the appointment on" + date + "at" + time + "Should I continue with the cancelation process?";
        options.session.attributes.CancelStepTwoIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }}
        
        else if  (request.intent.name === "CancelStepThreeIntent") {
        if (session.attributes.CancelStepTwoIntent) {
        // TODO: One thing we can add is to make sure that it is not too late to cancel the appointment. For example, if it is an hour before the appointment Nuffield Health might not accept the cancelation. However, our client didn't say anything about this feature so it is something we can add after we have complete all the main requirements.
        options.speechText = "No problem. The appointment has been cancelled. Thank you for using this application. We look forward to hearing from you soon ";
        options.endSession = true;
        context.succeed(buildResponse(options));
        }}
        
        else if  (request.intent.name === "QueryStepOneIntent") {
        // TODO: Again, make queries in the database as we need information about the existing bookings. Depending on the structure on your database, I will convert the data and extract the dates and times, so that I can add them to the responce. An array would be a good choice here. 
        options.speechText = "Sure. I am now making queries in the database. Please wait for a moment. You have in total three appointments. You have this this and that. Do you want me to repeat?";
        options.session.attributes.QueryStepOneIntent = true;
        options.endSession = false;
        context.succeed(buildResponse(options));
        }
        
        else if  (request.intent.name === "QueryStepTwoIntent") {
        if (session.attributes.QueryStepOneIntent) {
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
        }
        
    }
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
    
 
  if(options.session && options.session.attributes) {
    response.sessionAttributes = options.session.attributes;
  }
    return response;
}
