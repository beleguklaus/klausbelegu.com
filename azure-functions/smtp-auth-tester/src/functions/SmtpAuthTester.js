const { app } = require('@azure/functions');
const nodemailer = require('nodemailer');

app.http('SmtpAuthTester', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log('SMTP Auth Tester function processing request.');
        
        // Handle GET requests
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
        
        // Parse request body
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
        
        // Extract parameters from request
        const smtpServer = body.smtpServer;
        const port = parseInt(body.port);
        const username = body.username;
        const password = body.password;
        const useTLS = body.useTLS !== false;
        const testEmailTo = body.testEmailTo || null;
        
        try {
            // Configure Nodemailer transporter
            const transporter = nodemailer.createTransport({
                host: smtpServer,
                port: port,
                secure: port === 465,
                auth: {
                    user: username,
                    pass: password
                },
                tls: {
                    rejectUnauthorized: false
                }
            });
            
            // Test the connection
            const verifyResult = await transporter.verify();
            
            // Initialize result object
            const result = {
                status: "success",
                connectionTest: {
                    success: true,
                    timestamp: new Date().toISOString(),
                    server: smtpServer,
                    port: port,
                    auth: "Authentication successful",
                    username: username
                }
            };
            
            // Send test email if address provided
            if (testEmailTo) {
                try {
                    const info = await transporter.sendMail({
                        from: username,
                        to: testEmailTo,
                        subject: 'SMTP Auth Test',
                        text: `This is a test email sent at ${new Date().toISOString()} to verify SMTP functionality.`,
                        html: `<p>This is a test email sent at ${new Date().toISOString()} to verify SMTP functionality.</p>
                              <p>SMTP Server: ${smtpServer}<br>
                              Port: ${port}<br>
                              Username: ${username}</p>`
                    });
                    
                    result.emailTest = {
                        success: true,
                        messageId: info.messageId,
                        recipient: testEmailTo,
                        timestamp: new Date().toISOString()
                    };
                } catch (emailError) {
                    result.emailTest = {
                        success: false,
                        error: emailError.message,
                        recipient: testEmailTo,
                        timestamp: new Date().toISOString()
                    };
                }
            }
            
            return {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(result)
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
                    message: "SMTP authentication failed",
                    errorDetails: error.message,
                    server: smtpServer,
                    port: port,
                    username: username,
                    timestamp: new Date().toISOString()
                })
            };
        }
    }
});