const PayPal = require("../src");

const CLIENT_ID = "";
const CLIENT_SECRET = "";
const SUCCESS_CALLBACK_URL = "https://www.your-store.com/success";
const CANCEL_CALLBACK_URL = "https://www.your-store.com/checkout";

(async function () {
    const paypal = new PayPal(CLIENT_ID, CLIENT_SECRET, {
        sandbox: true, // testing
        currency: "EUR",
        successCallbackUrl: SUCCESS_CALLBACK_URL,
        cancelCallbackUrl: CANCEL_CALLBACK_URL
    });

    // SIMPLE PAYMENT 

    try {
        const payment1 = await paypal.createPayment({
            amount: 10,
            description: "My Shop Inc.",

            // optional fields

            shipping: 5,    // 0 by default
            discount: 4,    // 0 by default
            discountText: "Welcome reduction", // "Discount" by default
            currency: "EUR",    // overrides the value by default
            successURL: "https://www.your-store.com/payment-success",    // overrides the value set before
            cancelURL: "https://www.your-store.com/payment-canceled"    // overrides the value set before
        });

        // Handle the result here
        console.log("Payment ID:", payment1.id);
        console.log("Redirect URL", payment1.redirect);  // Redirect your client's browser to this URL
        console.log("Info URL", payment1.get);  // Get the payment info from this URL
        console.log("Execute URL", payment1.execute);  // Execute the payment through this URL (payment approval is needed)
    }
    catch (error) {
        console.error(error.message);
    }

    // DETAILED CART PAYMENT 

    try {
        const payment2 = await paypal.createPayment({
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
            discountText: "Welcome reduction", // "Discount" by default
            currency: "EUR",    // overrides the value by default
            successURL: "https://www.your-store.com/payment-success",    // overrides the value set before
            cancelURL: "https://www.your-store.com/payment-canceled"    // overrides the value set before
        });

        // Handle the result here
        console.log("Payment ID:", payment2.id);
        console.log("Redirect URL", payment2.redirect);  // Redirect your client's browser to this URL
        console.log("Info URL", payment2.get);  // Get the payment info from this URL
        console.log("Execute URL", payment2.execute);  // Execute the payment through this URL (payment approval is needed)
    }
    catch (error) {
        console.error(error.message);
    }

    // PAYMENT EXECUTION

    try {
        const result = await paypal.executePayment("payment-id", "token", "payer-id");
        console.log("Payment result:", result);
    }
    catch (error) {
        console.error(error.message);
    }
})();
