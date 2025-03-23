const { app } = require('@azure/functions');
const nodemailer = require('nodemailer');

app.http('SmtpAuthTester', {
    methods: ['GET', 'POST'],
    authLevel: 'function', // Keep this as function since you're using a key
    handler: async (request, context) => {
        context.log('SMTP Auth Tester function processing request.');

        // Handle GET requests with a simple status response
        if (request.method === 'GET') {
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: "ready",
                    message: "SMTP Auth Tester is running. Please send a POST request with SMTP server details."
                })
            };
        }

        // Try to parse request body with proper error handling
        let body;
        try {
            const bodyText = await request.text();
            context.log('Request body received:', bodyText);
            
            if (!bodyText || bodyText.trim() === '') {
                return {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        status: "error",
                        message: "Request body is empty. Please provide SMTP server details."
                    })
                };
            }
            
            body = JSON.parse(bodyText);
        } catch (error) {
            context.log('Error parsing request:', error);
            return {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: "error",
                    message: "Invalid JSON in request body",
                    error: error.message
                })
            };
        }

        // Rest of your existing code here...
        // Make sure every response includes proper headers and valid JSON

        // The existing function implementation...
        // At the end of the function, add these lines:
        
        // Add proper error handling for the nodemailer operations
        try {
            // Your nodemailer code...
            
            // Make sure to return a properly formatted response
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: "success",
                    message: "SMTP test completed successfully"
                    // Include other response data here
                })
            };
        } catch (error) {
            context.log('Error in SMTP test:', error);
            return {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: "error",
                    message: "Error during SMTP test",
                    error: error.message
                })
            };
        }
    }
});