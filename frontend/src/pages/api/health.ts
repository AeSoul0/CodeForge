// Exports the asynchronous GET function to handle HTTP GET requests to this endpoint
export async function GET() {
    // Returns a new Response object (standard Web API used by Astro)
    return new Response(
        // Converts a JavaScript object into a JSON string to form the response body
        JSON.stringify({
            status: 'ok', // Quickly indicates that the API is up and running
            message: 'Frontend is running smoothly', // A descriptive text message
            timestamp: new Date().toISOString() // Captures the exact date and time of the request in ISO 8601 format
        }), {
        // Object containing the HTTP response options
        status: 200, // Sets the HTTP status code to 200 (Success/OK)
        headers: {
            // Informs the client (e.g., the browser) that the content being received is in JSON format
            'Content-Type': 'application/json'
        }
    }
    );
}