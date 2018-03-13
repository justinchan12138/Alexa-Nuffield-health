'use strict';
const AWS = require("aws-sdk");
AWS.config.update({
    region: "eu-west-1",
});
var docClient = new AWS.DynamoDB.DocumentClient();
var UserEmail = 'wrong@gmail.com';

exports.handler = function(event, context) {

    try {
        var request = event.request;
        var session = event.session;
        getProfile(session);
        console.log(UserEmail);
        if (!event.session.attributes) {
            event.session.attributes = {};
        }

        if (request.type === "LaunchRequest") {
            let options = {};
            options.speechText = "Welcome to Nuffield Health. You can use this application to manage your appointments. How can I help you";
            options.endSession = false;
            context.succeed(buildResponse(options));

        } else if (request.type === "IntentRequest") {
            let options = {};
            options.session = session;

            if (request.intent.name === "MakeBookingStepOneIntent") {
                options.speechText = "Sure. Can you please specify the time and date of the appointment? ";
                options.session.attributes.MakeBookingStepOneIntent = true;
                options.endSession = false;
                context.succeed(buildResponse(options));
            } else if (request.intent.name === "MakeBookingStepTwoIntent") {

                if (session.attributes.MakeBookingStepOneIntent) {
                    var date = request.intent.slots.date.value;
                    var time = request.intent.slots.time.value;
                    if (date != undefined && time != undefined) {

                        var params = {
                            TableName: "Nuffield_Health_Alexa_Final",
                            ProjectionExpression: "#d, #t",
                            FilterExpression: "#d = :d and #t = :t",
                            ExpressionAttributeNames: {
                                "#d": "DateOfBooking",
                                "#t": "TimeOfBooking"
                            },
                            ExpressionAttributeValues: {
                                ":d": date,
                                ":t": time
                            }

                        };


                        docClient.scan(params, function(err, data) {
                            if (err) {
                                console.log(err);
                                options.speechText = "There has been an error";
                                options.endSession = true;
                                context.succeed(buildResponse(options));
                            } else {
                                if (data.Count == 0) {
                                    options.session.attributes.date = date;
                                    options.session.attributes.time = time;
                                    options.speechText = "Sure. There is an empty time slot on " + date + " at " + time + ". Would you like me to make an appointment for you?";
                                    options.endSession = false;
                                    options.session.attributes.MakeBookingStepTwoIntent = true;
                                    context.succeed(buildResponse(options));
                                } else {
                                    // Something need to be improved here. We should give the user a list of things. 

                                    options.speechText = "Sorry. The time slot you specified is not currently available";
                                    options.endSession = true;
                                    context.succeed(buildResponse(options));

                                }
                            }

                        });

                    }

                } else {
                    options.speechText = "Wrong invocation of this intent";
                    options.endSession = true;
                    context.succeed(buildResponse(options));
                }
            } else if (request.intent.name === "MakeBookingStepThreeIntent") {

                if (session.attributes.MakeBookingStepTwoIntent) {


                    var params = {
                        Item: {
                            DateOfBooking: options.session.attributes.date,
                            TimeOfBooking: options.session.attributes.time,
                            Username: UserEmail
                        },

                        TableName: 'Nuffield_Health_Alexa_Final'
                    };

                    docClient.put(params, function(err, date) {
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
                } else {
                    options.speechText = "Wrong invocation of this intent";
                    options.endSession = true;
                    context.succeed(buildResponse(options));
                }
            } else if (request.intent.name === "CancelStepOneIntent") {


                var params = {
                    TableName: "Nuffield_Health_Alexa_Final",
                    ProjectionExpression: "DateOfBooking, TimeOfBooking, #u",
                    FilterExpression: "#u = :u",
                    ExpressionAttributeNames: {
                        "#u": "Username"
                    },
                    ExpressionAttributeValues: {
                        ":u": UserEmail
                    }
                };

                docClient.scan(params, function(err, data) {
                    if (err) {
                        console.log(err);
                        options.speechText = "There has been an error";
                        options.endSession = true;
                        context.succeed(buildResponse(options));
                    } else {
                        options.speechText = "Sure. I have sent a list of your existing appointments on the alexa application on your phone. Which appointment would you like to cancel?";
                        options.cardTitle = "Your existing bookings";

                        var cardOutput = "";
                        data.Items.forEach(function(item) {
                            cardOutput += item.DateOfBooking + " --- " + item.TimeOfBooking + "\n";
                        })
                        options.cardContent = cardOutput;
                        options.endSession = false;
                        options.session.attributes.CancelStepOneIntent = true;
                        context.succeed(buildResponse(options));
                    }

                });

            } else if (request.intent.name === "CancelStepTwoIntent") {

                if (session.attributes.CancelStepOneIntent) {

                    let date = request.intent.slots.date.value;
                    let time = request.intent.slots.time.value;
                    options.speechText = "Sure. Just to confirm. You would like me to cancel the appointment on" + date + "at" + time + "Should I continue with the cancelation process?";
                    options.session.attributes.CancelStepTwoIntent = true;
                    options.session.attributes.date = date;
                    options.session.attributes.time = time;
                    options.endSession = false;
                    context.succeed(buildResponse(options));
                }
            } else if (request.intent.name === "CancelStepThreeIntent") {
                if (session.attributes.CancelStepTwoIntent) {
                    var date = options.session.attributes.date;
                    var time = options.session.attributes.time;
                    // cancel it in the database

                    var params = {
                        TableName: "Nuffield_Health_Alexa_Final",
                        Key: {
                            "DateOfBooking": date,
                            "TimeOfBooking": time
                        },
                        ConditionExpression: "Username = :u",
                        ExpressionAttributeValues: {
                            ":u": UserEmail
                        }
                    };
                    docClient.delete(params, function(err, data) {
                        if (err) {
                            console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
                        } else {
                            console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
                        }
                    });



                    options.speechText = "No problem. The appointment has been cancelled. Thank you for using this application. We look forward to hearing from you soon ";
                    options.endSession = true;
                    context.succeed(buildResponse(options));
                }
            } else if (request.intent.name === "QueryStepOneIntent") {
                var params = {
                    TableName: "Nuffield_Health_Alexa_Final",
                    ProjectionExpression: "DateOfBooking, TimeOfBooking, #u",
                    FilterExpression: "#u = :u",
                    ExpressionAttributeNames: {
                        "#u": "Username"
                    },
                    ExpressionAttributeValues: {
                        ":u": UserEmail
                    }
                };

                docClient.scan(params, function(err, data) {
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
                        data.Items.forEach(function(item) {
                            cardOutput += item.DateOfBooking + " --- " + item.TimeOfBooking + "\n";
                        })
                        options.cardContent = cardOutput;
                        options.endSession = true;
                        options.session.attributes.MakeBookingStepTwoIntent = true;
                        context.succeed(buildResponse(options));
                    }
                });
            } else if (request.intent.name == "AMAZON.CancelIntent") {
                options.speechText = "No Problem. The process has been cancelled. We look forward to hearing from you again. Good bye";
                options.endSession = true;
                context.succeed(buildResponse(options));
            } else {
                throw "unknown intent";
            }
        } else if (request.type === "SessionEndedRequest") {

        } else {
            throw "Unknown intent type";
        }




    } catch (e) {
        context.fail("Exception:" + e);
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
            "shouldEndSession": options.endSession
        }
    };
    if (options.repromText) {
        response.response.repromt = {
            outputSpeech: {
                type: "PlainText",
                text: options.repromptText
            }
        };
    }

    if (options.cardTitle) {
        response.response.card = {
            type: "Simple",
            title: options.cardTitle,
            content: options.cardContent
        }
    }


    if (options.session && options.session.attributes) {
        response.sessionAttributes = options.session.attributes;
    }
    return response;
}

function getProfile(session) {
    var finalResults = '';
    var https = require('https');
    var accesss_token = session.user.accessToken;
    var url = "https://www.googleapis.com/gmail/v1/users/me/profile?access_token=" + accesss_token;


    var req = https.get(url, function(res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });

        res.on('end', function() {

            var content = JSON.parse(body);

            UserEmail = content.emailAddress;
            console.log("******" + UserEmail);

        });

    });

    req.on('error', function(err) {
        console.log(err);
    });


}

