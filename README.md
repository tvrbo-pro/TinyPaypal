# Tiny PayPal
The missing PayPal tool for Node

PayPal has literally TONS of documentation, but little to none is targeted for Node users.

This is a dead-simple tool to create payments using the modern and elegant version of PayPal, solving hours of tedious research, trial and error.

### Install the module

	npm install tiny-paypal

### Initialize it

	var tp = require('tiny-paypal');

	tp.init({
		CLIENT_ID: 'YOUR-ID-HERE', 
		CLIENT_SECRET: 'YOUR-SECRET-HERE',
		SUCCESS_CALLBACK_URL: 'https://your-server.com/payment-success',
		CANCELED_CALLBACK_URL: 'https://your-server.com/payment-canceled',
		SANDBOX: true,  // leave false for production
	});

### Create a payment

	tp.createPayment(72.51, 'EUR', 'ACME Corporation Store')
	.then(function(result){
		// Handle the result here
		console.log("Payment ID:", result.id);
		console.log("Redirect URL", result.url);  // Redirect your client's browser to this URL
	})
	.catch(function(error){
		// Handle the error here
		console.error(error);
	})

Redirect your client to the given URL. When the client validates the payment, PayPal will redirect the browser to the `SUCCESS_CALLBACK_URL` with three query parameters:`paymentId`, `token` and `PayerID`.

### Get these parameters and execute the payment

	executePayment('the-payment-id', 'the-token', 'the-payer-id')
	.then(function(result){
		// Handle the result here
		console.log("Response:", result);
	})
	.catch(function(error){
		// Handle the error here
		console.error(error);
	})

This will log into the console something like:

	Response: { id: 'PAY-1NA38651KW861730HK6HVNHQ',
		intent: 'sale',
		state: 'approved',
		cart: '9H784395YC168205K',
		payer: 
		{ payment_method: 'paypal',
			status: 'VERIFIED',
			payer_info: 
				{
					email: 'buyer@company.pro',
					first_name: 'Test',
					last_name: 'Buyer',
					payer_id: 'MEFWRPEQDM(2J',
					shipping_address: [Object],
					country_code: 'ES',
					billing_address: [Object] } },
		transactions: 
		[ { amount: [Object],
				payee: [Object],
				description: 'ACME Corporation Store',
				item_list: [Object],
				related_resources: [Object] } ],
		create_time: '2016-07-20T11:45:47Z',
		links: 
		[ { href: 'https://api.sandbox.paypal.com/v1/payments/payment/PAY-1NA38651KW861730HK6HVNHQ',
				rel: 'self',
				method: 'GET' 
			}
		]
	}

## Useful Documentation and tools

* [https://developer.paypal.com/docs/integration/web/accept-paypal-payment/](https://developer.paypal.com/docs/integration/web/accept-paypal-payment/)
* [https://devblog.paypal.com/building-a-web-app-with-node-js-the-paypal-sdk-part-2/](https://devblog.paypal.com/building-a-web-app-with-node-js-the-paypal-sdk-part-2/)
* [https://devtools-paypal.com/guide/pay_paypal/curl?interactive=ON&env=sandbox](https://devtools-paypal.com/guide/pay_paypal/curl?interactive=ON&env=sandbox)

