const AWS = require("aws-sdk");
const axios = require('axios');
require('dotenv').config()

exports.handler = async (event) => {
    const reCapUrl = "https://www.google.com/recaptcha/api/siteverify";
    const snsTopic = process.env.AWSSNSARN;
    let lambdaResponse = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin" : "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Credentials" : true 
          },
          body: JSON.stringify('failure'),
    };

    if (event && event.requestContext && event.requestContext.http && event.requestContext.http.method === 'OPTIONS') {
        lambdaResponse = {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin" : "*",
                "Access-Control-Allow-Methods": "*",
                "Access-Control-Allow-Credentials" : true 
              }
        }
        return lambdaResponse;
    }

    const input = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { response, email, name, message } = input;
    const reCaptchaSecret = process.env.RECAPTCHA_SECRET; 

    if(!response || !email || !name || !message) {
        console.log("No Captcha supplied. Exit.");
        return lambdaResponse;
    } else {
        let verifyResult = await axios.post(reCapUrl, undefined, {
            params: {
                secret: reCaptchaSecret,
                response: response
            }
        });
        if (verifyResult.status === 200 && !verifyResult.data['error-codes'] && verifyResult.data.success) { 
            let emailbody = "New message from "+name+"\nEmail: "+email+"\n"+message;
            let sns = new AWS.SNS();
            let params = {
                Message: emailbody,
                Subject: "New Email from contact form from: "+email,
                TopicArn: snsTopic
            };
 
            let snsResult = await sns.publish(params).promise();

            lambdaResponse = {
                statusCode: 200,
                headers: {
                    "Access-Control-Allow-Origin" : "*",
                    "Access-Control-Allow-Methods": "*",
                    "Access-Control-Allow-Credentials" : true 
                  },
                  body: JSON.stringify('success'),
            };

            return lambdaResponse;
        } else {
            return lambdaResponse;
        }
    }
};