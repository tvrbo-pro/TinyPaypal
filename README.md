# Tiny PayPal
The missing PayPal tool for Node

<a href="https://snyk.io/test/github/TvrboPro/TinyPaypal"><img src="https://snyk.io/test/github/TvrboPro/TinyPaypal/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/TvrboPro/TinyPaypal" style="max-width:100%;"></a>

PayPal has literally A TON of documentation, but little to none is targeted for NodeJS users.

This is a dead-simple tool to create payments using the modern and elegant version of PayPal, solving hours of tedious research, trial and error.

### Install the module

	npm install tiny-paypal

### Initialize it

```js
var paypal = require('tiny-paypal');

paypal.init({
	CLIENT_ID: 'YOUR-ID-HERE', 
	CLIENT_SECRET: 'YOUR-SECRET-HERE',
	SUCCESS_CALLBACK_URL: 'https://your-server.com/payment-success',
	CANCELED_CALLBACK_URL: 'https://your-server.com/payment-canceled',
	SANDBOX: true,  // set to false for production
	CURRENCY: 'EUR'  // optional
});
```

### Create a simple payment

If you just want to charge an amount of money, you can use this function:

```js
paypal.createPayment({
	amount: 10,
	description: "MyShop cart",

	// optional fields

	shipping: 5,    // 0 by default
	discount: 4,    // 0 by default
	discountText: "Discount text", // "Discount" by default
	currency: 'EUR',    // overrides the value set in 'init()'
	successURL: "https://your-server.com/payment-success",    // overrides the value set in 'init()'  
	cancelURL: "https://your-server.com/payment-canceled"    // overrides the value set in 'init()'
})
.then(function(result){
	// Handle the result here
	console.log("Payment ID:", result.id);
	console.log("Redirect URL", result.redirect);  // Redirect your client's browser to this URL
	console.log("Info URL", result.get);  // Get the payment info from this URL
	console.log("Execute URL", result.execute);  // Execute the payment through this URL (payment approval is needed)
})
.catch(function(error){
	// Handle the error here
	console.error(error);
})
```

### Create a payment based on your cart

To display a list of the items purchased on the PayPal screen, you can use TinyPaypal like this:

```js
paypal.createCartPayment({
	cart: [{
		name: "Product 1",
		description: "Product 1 description here", // optional
		price: 3,
		quantity: 10, // optional
		sku: '#1234'  // optional
	},{
		name: "Product 2",
		description: "Product 2 description here", // optional
		price: 4,
		quantity: 5, // optional
		sku: '#1235' // optional
	}],
	description: "MyShop cart",
	
	// optional fields
	
	shipping: 5,
	discount: 4,
	discountText: "Discount text", // "Discount" by default
	currency: 'EUR',    // overrides the value set in 'init()'
	successURL: "https://your-server.com/payment-success",    // overrides the value set in 'init()'  
	cancelURL: "https://your-server.com/payment-canceled"    // overrides the value set in 'init()'
})
.then(function(result){
	// Handle the result here
	console.log("Payment ID:", result.id);
	console.log("Redirect URL", result.redirect);  // Redirect your client's browser to this URL
	console.log("Info URL", result.get);  // Get the payment info from this URL
	console.log("Execute URL", result.execute);  // Execute the payment through this URL (payment approval is needed)
})
.catch(function(error){
	// Handle the error here
	console.error(error);
})
```

### Redirect

Next, you need to redirect your client to `result.redirect`. When the client validates the payment, PayPal will redirect the browser to the `SUCCESS_CALLBACK_URL` with three query string parameters: `paymentId`, `token` and `PayerID`.


### Get these parameters and execute the payment

```js
paypal.executePayment('the-payment-id', 'the-token', 'the-payer-id')
.then(function(result){
	// Handle the result here
	console.log("Response:", result);
})
.catch(function(error){
	// Handle the error here
	console.error(error);
})
```

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

