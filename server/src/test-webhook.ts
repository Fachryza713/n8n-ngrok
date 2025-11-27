import fetch from 'node-fetch';

const webhookUrl = 'https://schemeless-charli-unenlightenedly.ngrok-free.dev/webhook-test/bc3934df-8d10-48df-9960-f0db1e806328';

async function testWebhook() {
    console.log('Testing webhook:', webhookUrl);
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Test from script',
                chatId: 'test-script',
                from: {
                    id: 'test-user',
                    first_name: 'Test User'
                }
            }),
        });

        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Raw Response Body:', text);

        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.log('Could not parse as JSON');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testWebhook();
