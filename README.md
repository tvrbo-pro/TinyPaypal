# Tiny PayPal
The missing PayPal tool for Node

<a href="https://snyk.io/test/github/TvrboPro/TinyPaypal"><img src="https://snyk.io/test/github/TvrboPro/TinyPaypal/badge.svg" alt="Known Vulnerabilities" data-canonical-src="https://snyk.io/test/github/TvrboPro/TinyPaypal" style="max-width:100%;"></a>

PayPal has literally A TON of documentation, but little to none is targeted for NodeJS users.

This is a simple tool to create payments using the modern and elegant version of PayPal, solving hours of research, trial and error.

### Install the module

```bash
yarn add tiny-paypal
# npm install tiny-paypal
```

### Initialize it

```js
const PayPal = require('tiny-paypal');

const CLIENT_ID = "your-client-id-here";
const CLIENT_SECRET = "your-client-secret-here";
const SUCCESS_CALLBACK_URL = "https://www.your-store.com/success";
const CANCEL_CALLBACK_URL = "https://www.your-store.com/checkout";

const defaults = {
	sandbox: true, 		// leave blank for production (default)
	currency: "EUR",	// by default "USD"
	successCallbackUrl: SUCCESS_CALLBACK_URL,
	cancelCallbackUrl: CANCEL_CALLBACK_URL
};

const paypal = new PayPal(CLIENT_ID, CLIENT_SECRET, defaults);
```

### Create a simple payment

If you just want to charge an amount of money, you can invoke this method:

```js
try {
	const payment = await paypal.createPayment({
		amount: 10,
		description: "My Shop Inc.",

		// optional fields

		shipping: 5,    // 0 by default
		discount: 4,    // 0 by default
		discountText: "Welcome discount", // "Discount" by default
		currency: "EUR",    // overrides the value by default
		successCallbackUrl: "https://www.your-store.com/payment-success",    // overrides the value set before
		cancelCallbackUrl: "https://www.your-store.com/payment-canceled"    // overrides the value set before
	});

	// Handle the result here
	console.log("Payment ID:", payment.id);
	console.log("Redirect URL", payment.redirect);  // Redirect your client's browser to this URL
	console.log("Info URL", payment.get);  // Get the payment info from this URL
	console.log("Execute URL", payment.execute);  // Execute the payment through this URL (payment approval is needed)
}
catch (error) {
	// Handle the error
	console.error(error.message);
}
```

### Create a payment based on your cart

To display a list of the items on the PayPal screen, you can use TinyPaypal like this:

```js
try {
	const payment = await paypal.createCartPayment({
		cart: [{
			name: "Product 1",
			description: "Product 1 description here", // optional
			price: 3,
			quantity: 10, // optional
			sku: '#1234'  // optional
		}, {
			name: "Product 2",
			description: "Product 2 description here", // optional
			price: 4,
			quantity: 5, // optional
			sku: '#1235' // optional
		}],
		description: "My Shop Inc.",

		// optional fields

		shipping: 5,
		discount: 4,
		discountText: "Welcome discount", // "Discount" by default
		currency: "EUR",    // overrides the value by default
		successCallbackUrl: "https://www.your-store.com/payment-success",    // overrides the value set before
		cancelCallbackUrl: "https://www.your-store.com/payment-canceled"    // overrides the value set before
	});

	// Handle the result here
	console.log("Payment ID:", payment.id);
	console.log("Redirect URL", payment.redirect);  // Redirect your client's browser to this URL
	console.log("Info URL", payment.get);  // Get the payment info from this URL
	console.log("Execute URL", payment.execute);  // Execute the payment through this URL (payment approval is needed)
}
catch (error) {
	// Handle the error
	console.error(error.message);
}

```

### Redirect

Next, you need to redirect your client to `result.redirect`. When the client confirms the payment, PayPal will redirect the browser to the `SUCCESS_CALLBACK_URL` with three query string parameters: `paymentId`, `token` and `PayerID`.


### Get these parameters and execute the payment

```js
try {
	const result = await paypal.executePayment("payment-id", "token", "payer-id");
	console.log("Payment result:", result);
}
catch (error) {
	// Handle the error
	console.error(error.message);
}
```

This will log to the console something like:

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

