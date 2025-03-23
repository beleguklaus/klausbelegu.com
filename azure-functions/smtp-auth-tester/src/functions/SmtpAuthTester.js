const { app } = require('@azure/functions');
const nodemailer = require('nodemailer');

app.http('SmtpAuthTester', {
    methods: ['GET', 'POST'],
    authLevel: 'function',
    handler: async (request, context) => {
        context.log('SMTP Auth Tester function processing request.');

        // Check request method and handle accordingly
        if (request.method === 'GET') {
            return {
                status: 200,
                body: JSON.stringify({
                    message: "SMTP Auth Tester is running. Please send a POST request with SMTP server details."
                })
            };
        }

        // Try to parse request body, with error handling
        let body;
        try {
            const bodyText = await request.text();
            if (!bodyText) {
                return {
                    status: 400,
                    body: JSON.stringify({
                        status: "error",
                        message: "Request body is empty. Please provide SMTP server details."
                    })
                };
            }
            body = JSON.parse(bodyText);
        } catch (error) {
            return {
                status: 400,
                body: JSON.stringify({
                    status: "error",
                    message: "Invalid JSON in request body",
                    error: error.message
                })
            };
        }

        // Check if all required parameters are provided
        if (!body || !body.smtpServer || !body.port || !body.username || !body.password) {
            return {
                status: 400,
                body: JSON.stringify({
                    status: "error",
                    message: "Please provide all required parameters: smtpServer, port, username, password",
                    requiredFields: ["smtpServer", "port", "username", "password"],
                    optionalFields: ["useTLS", "testEmailTo"]
                })
            };
        }

        // Rest of your function stays the same...
        // Extract parameters from request
        const smtpServer = body.smtpServer;
        const port = parseInt(body.port);
        const username = body.username;
        const password = body.password;
        const useTLS = body.useTLS !== false; // Default to true if not specified
        const testEmailTo = body.testEmailTo || null;

        try {
            // Configure Nodemailer transporter
            const transporter = nodemailer.createTransport({
                host: smtpServer,
                port: port,
                secure: port === 465, // true for 465, false for other ports
                auth: {
                    user: username,
                    pass: password
                },
                tls: {
                    // Do not fail on invalid certs
                    rejectUnauthorized: false
                }
            });

            // Test the connection (verify auth)
            const verifyResult = await transporter.verify();
            
            // Initialize result object with connection success
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

            // If a test email address was provided, try sending a test email
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
                body: JSON.stringify(result)
            };
        } catch (error) {
            return {
                status: 400,
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