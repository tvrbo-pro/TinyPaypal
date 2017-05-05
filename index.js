var request = require('request-promise');
var Promise = require('bluebird');

var config = {
  initialized: false,
  URL_PREFIX: 'https://api.paypal.com',
  CLIENT_ID: '',
  CLIENT_SECRET: '',
  SUCCESS_CALLBACK_URL: '',
  CANCELED_CALLBACK_URL: '',
  CURRENCY: 'USD'
};

function init(defaults) {
  if (!defaults || typeof defaults != 'object') throw new Error("Invalid parameters");
  else if (!defaults.CLIENT_ID) throw new Error("The PayPal Client ID is required");
  else if (!defaults.CLIENT_SECRET) throw new Error("The PayPal Client Secret is required");
  else if (!defaults.SUCCESS_CALLBACK_URL) throw new Error("The PayPal Success URL is required");
  else if (!defaults.CANCELED_CALLBACK_URL) throw new Error("The PayPal Cancel URL is required");

  config.CLIENT_ID = defaults.CLIENT_ID;
  config.CLIENT_SECRET = defaults.CLIENT_SECRET;
  config.SUCCESS_CALLBACK_URL = defaults.SUCCESS_CALLBACK_URL;
  config.CANCELED_CALLBACK_URL = defaults.CANCELED_CALLBACK_URL;

  if (defaults.CURRENCY) config.CURRENCY = defaults.CURRENCY;
  if (defaults.SANDBOX) config.URL_PREFIX = "https://api.sandbox.paypal.com";

  config.initialized = true;
}

function getAccessToken() {
  if (!config.initialized) return Promise.reject(new Error("Tiny PayPal must be initialized before it can be used"));

  return request.post({
    uri: config.URL_PREFIX + '/v1/oauth2/token',
    headers: {
      Authorization: 'Basic ' + new Buffer(config.CLIENT_ID + ':' + config.CLIENT_SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
    },
    form: {
      grant_type: 'client_credentials'
    },
    json: true
  })
  .then(function (response) {
    return response.access_token;
  });
}


function createPayment(parameters) {
  if(!parameters || typeof parameters !== 'object') return Promise.reject(new Error("Invalid parameters"));
  else if (!config.initialized) return Promise.reject(new Error("Tiny PayPal must be initialized before it can be used"));

  const { amount, shipping = 0, discount = 0, discountText = "Discount", currency, description, successURL, cancelURL } = parameters;

  if (!amount) return Promise.reject(new Error("Please, enter an amount of money to charge"));
  else if(typeof amount !== 'number' || typeof shipping !== 'number' || typeof discount !== 'number') return Promise.reject(new Error("Amount, shipping and discount must be numerical values"));
  else if (!description) return Promise.reject(new Error("Please, enter a description for the transaction as it should appear on PayPal"));

  return getAccessToken()
    .then(function (accessToken) {
      const itemList = [{
        name: description,
        // description: "description here",
        price: amount.toFixed(2),
        quantity: "1",
        // tax: "0.00",
        // sku: "#1234",
        currency: currency || config.CURRENCY
      }];

      if(discount){
        itemList.push({
            name: discountText,
            // description: "no description",
            price: `-${discount.toFixed(2)}`,
            quantity: "1",
            // tax: "0.00",
            // sku: "#1234",
            currency: currency || config.CURRENCY
          });
      }

      const body = {
        transactions: [{
          item_list: {
            items: itemList
          },
          amount: {
            currency: currency || config.CURRENCY,
            total: (amount + shipping - discount).toFixed(2),
            details: {
              subtotal: (amount - discount).toFixed(2),
              shipping: shipping.toFixed(2),
              // tax: "0.00",
              // handling_fee: "0.00",
              // shipping_discount: "-0.00",
              // insurance: "0.00"
            }
          },
          description: description
        }],
        payer: {
          payment_method: "paypal"
        },
        intent: "sale",
        redirect_urls: {
          return_url: successURL || config.SUCCESS_CALLBACK_URL,
          cancel_url: cancelURL || config.CANCELED_CALLBACK_URL
        }
      }

      return request.post({
        uri: config.URL_PREFIX + '/v1/payments/payment',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        },
        body: body,
        json: true
      });
    })
    .then(function (payment) {
      if (!payment.links) throw new Error("The transaction could not be created");

      var result = {
        id: payment.id
        // get
        // redirect
        // execute
      }

      for (var index = 0; index < payment.links.length; index++) {
        if (payment.links[index].rel === 'self')
          result.get = payment.links[index].href;
        else if (payment.links[index].rel === 'approval_url')
          result.redirect = payment.links[index].href;
        else if (payment.links[index].rel === 'execute')
          result.execute = payment.links[index].href;
        else
          throw new Error("The transaction got an invalid response");
      }
      if (result.redirect) return result;
      throw new Error("The transaction could not be created");
    });
}

function createCartPayment(parameters) {
  if(!parameters || typeof parameters !== 'object') return Promise.reject(new Error("Invalid parameters"));
  else if (!config.initialized) return Promise.reject(new Error("Tiny PayPal must be initialized before it can be used"));

  const { cart, shipping = 0, discount = 0, discountText = "Discount", currency, description, successURL, cancelURL } = parameters;

  if (!cart || typeof cart !== 'object') return Promise.reject(new Error("Please, provide an array of items for the cart"));
  else if (!description) return Promise.reject(new Error("Please, enter a description for the transaction as it should appear on PayPal"));

  let itemList;
  try {
    itemList = cart.map(item => {
      if(!item.name || typeof item.name !== 'string') throw new Error("The cart contains an item without a name");
      else if(!item.price || typeof item.price !== 'number') throw new Error("The cart contains an item without a numeric price");
      else if(item.quantity && typeof item.price !== 'number') throw new Error("The cart contains an item with a non-numeric quantity");

      return {
        name: item.name,
        description: item.description || "",
        price: item.price.toFixed(2),
        quantity: (item.quantity || 1).toString(),
        sku: item.sku || undefined,
        currency: currency || config.CURRENCY
        // tax: "0.00"
      }
    });
  }
  catch(err){
    return Promise.reject(err);  
  }

  if(discount){
    itemList.push({
        name: discountText,
        // description: "no description",
        price: `-${discount.toFixed(2)}`,
        quantity: "1",
        // tax: "0.00",
        // sku: "#1234",
        currency: currency || config.CURRENCY
      });
  }

  // prices taken from the original cart array, not itemList
  const amount = cart.reduce((prev, cur) => prev + (cur.price * (cur.quantity || 1)), 0);

  return getAccessToken()
    .then(function (accessToken) {
      const body = {
        transactions: [{
          item_list: {
            items: itemList
          },
          amount: {
            currency: currency || config.CURRENCY,
            total: (amount + shipping - discount).toFixed(2),
            details: {
              subtotal: (amount - discount).toFixed(2),
              shipping: shipping.toFixed(2),
              // tax: "0.00",
              // handling_fee: "0.00",
              // shipping_discount: "-0.00",
              // insurance: "0.00"
            }
          },
          description: description
        }],
        payer: {
          payment_method: "paypal"
        },
        intent: "sale",
        redirect_urls: {
          return_url: successURL || config.SUCCESS_CALLBACK_URL,
          cancel_url: cancelURL || config.CANCELED_CALLBACK_URL
        }
      }

      return request.post({
        uri: config.URL_PREFIX + '/v1/payments/payment',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        },
        body: body,
        json: true
      });
    })
    .then(function (payment) {
      if (!payment.links) throw new Error("The transaction could not be created");

      var result = {
        id: payment.id
        // get
        // redirect
        // execute
      }

      for (var index = 0; index < payment.links.length; index++) {
        if (payment.links[index].rel === 'self')
          result.get = payment.links[index].href;
        else if (payment.links[index].rel === 'approval_url')
          result.redirect = payment.links[index].href;
        else if (payment.links[index].rel === 'execute')
          result.execute = payment.links[index].href;
        else
          throw new Error("The transaction got an invalid response");
      }
      if (result.redirect) return result;
      throw new Error("The transaction could not be created");
    });
}

function executePayment(paymentId, token, payerId) {
  if (!config.initialized) return Promise.reject(new Error("Tiny PayPal must be initialized before it can be used"));
  else if (!paymentId || !token || !payerId) return Promise.reject(new Error("Invalid parameters"));

  return getAccessToken()
    .then(function (accessToken) {
      return request.post({
        uri: config.URL_PREFIX + '/v1/payments/payment/' + paymentId + '/execute/',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + accessToken
        },
        body: {
          payer_id: payerId
        },
        json: true
      });
    });
}


module.exports = {
  init,
  getAccessToken,
  createPayment,
  createCartPayment,
  executePayment
}


// This might be useful for future work

/* 
Resources

https://github.com/Aarturo/paypal-express-checkout/blob/master/example/app.js
https://www.npmjs.com/package/paypal-express-checkout-simple
https://github.com/visla/paypal-express-checkout
https://github.com/petersirka/node-paypal-express-checkout


https://developer.paypal.com/docs/classic/express-checkout/in-context/integration/
https://developer.paypal.com/docs/classic/express-checkout/integration-guide/ECGettingStarted/

https://developer.paypal.com/docs/classic/
(https://developer.paypal.com/docs/directory/)

Random INFO
https://github.com/paypal/PayPal-node-SDK
https://developer.paypal.com/docs/integration/direct/create-billing-plan/
https://developer.paypal.com/docs/integration/direct/accept-credit-cards/
https://developer.paypal.com/docs/api/payments.billing-plans/#definition-payment_definition

*/

// export function processPaymentWithStoredCard(creditCartId, amount) {
//   if(!amount || !(amount > 0)) return Promise.reject();

//   return new Promise(function(resolve, reject){
//     var newTransactionFromSavedCard = {
//         intent: "sale",
//         payer: {
//             payment_method: "credit_card",
//             funding_instruments: [{
//                 credit_card_token: {
//                     credit_card_id: creditCartId
//                 }
//             }]
//         },
//         transactions: [{
//             amount: {
//                 currency: "EUR",
//                 total: amount.toFixed(2)
//             },
//             description: "Right Side Coffe Roasters"
//         }]
//     }
//     paypal.payment.create(newTransactionFromSavedCard, function(error, payment) {
//       if(error) {
//         console.log('processPaymentWithStoredCard ERROR: ', error);
//         return reject(error);
//       }
//       resolve(payment);
//     });
//   });
// }


// SUBSCRIPTIONS

// Create the billing plan
// function createBillingPlan(amount, shipping, tax, name, description, address) {
//   if(!amount || !(amount > 0)) return Promise.reject('No amount is supplied');
//   else if(!shipping || !(shipping > 0)) return Promise.reject('No shipping is supplied');
//   else if(!tax || !(tax > 0)) return Promise.reject('No tax is supplied');

//   return new Promise(function(resolve, reject){
//     var billingPlanAttributes = {
//         description: description,
//         merchant_preferences: {
//             auto_bill_amount: "yes",
//             cancel_url: "http://www.cancel.com",
//             initial_fail_amount_action: "continue",
//             max_fail_attempts: "2",
//             return_url: "http://www.success.com",
//             setup_fee: {
//                 currency: "EUR",
//                 value: "0"
//             }
//         },
//         name: name,
//         payment_definitions: [
//             {
//                 amount: {
//                     currency: "EUR",
//                     value: amount.toFixed(2)
//                 },
//                 charge_models: [
//                     {
//                         amount: {
//                             currency: "EUR",
//                             value: shipping.toFixed(2)
//                         },
//                         type: "SHIPPING"
//                     },
//                     {
//                         amount: {
//                             currency: "EUR",
//                             value: tax.toFixed(2)
//                         },
//                         type: "TAX"
//                     }
//                 ],
//                 cycles: "0",
//                 frequency: "MONTH",
//                 frequency_interval: "1",
//                 name: "Regular 1",
//                 type: "REGULAR"
//             }
//         ],
//         type: "INFINITE"
//     }

//     paypal.billingPlan.create(billingPlanAttributes, function(error, billingPlan) {
//         if (error) reject(error);
//         else resolve(billingPlan);
//     });
//   })
//   .then(function(newBillingPlan){
//     return activateBillingPlan(newBillingPlan);
//   })
//   .then(function(billingPlanId){
//     return createBillingAgreement(billingPlanId, address);
//   });
// }

// // Activate the plan by changing status to Active
// function activateBillingPlan(billingPlan) {
//   return new Promise(function(resolve, reject){

//     var billingPlanUpdateAttributes = [ {
//         op: "replace",
//         path: "/",
//         value: {
//             state: "ACTIVE"
//         }
//     }];

//     paypal.billingPlan.update(billingPlan.id, billingPlanUpdateAttributes, function(error, response) {
//         if (error) return reject(error);

//         // console.log("Billing Plan state changed to " + billingPlan.state);
//         billingAgreementAttributes.plan.id = billingPlan.id;
//         resolve(billingPlan.id);
//     });
//   });
// }

// // Use activated billing plan to create agreement
// function createBillingAgreement(billingPlanId, address){
//   return new Promise(function(resolve, reject){
//     var isoDate = new Date();
//     isoDate.setSeconds(isoDate.getSeconds() + 4);
//     isoDate.toISOString().slice(0, 19) + 'Z';

//     var billingAgreementAttributes = {
//         name: "Fast Speed Agreement",
//         description: "Agreement for Fast Speed Plan",
//         start_date: isoDate,
//         plan: {
//             id: billingPlanId // "P-0NJ10521L3680291SOAQIVTQ"
//         },
//         payer: {
//             payment_method: "paypal"
//         },
//         shipping_address: {
//             line1: address.line1,
//             line2: address.line2,
//             city: address.city,
//             state: address.state,
//             postal_code: address.postalCode,
//             country_code: address.countryCode
//         }
//     }

//     paypal.billingAgreement.create(billingAgreementAttributes, function(error, billingAgreement) {
//         if (error) return reject(error);

//         for (var index = 0; index < billingAgreement.links.length; index++) {
//             if (billingAgreement.links[index].rel === 'approval_url') {
//                 var approval_url = billingAgreement.links[index].href;
//                 return resolve({
//                   approvalURL: approval_url,
//                   paymentToken: url.parse(approval_url, true).query.token
//                 });
//                 // console.log("For approving subscription via Paypal, first redirect user to");
//                 // console.log(approval_url);
//                 //
//                 // console.log("Payment token is");
//                 // console.log(url.parse(approval_url, true).query.token);
//                 // // See billing_agreements/execute.js to see example for executing agreement
//                 // // after you have payment token
//             }
//         }
//     });
//   });
// }

// function executeBillingAgreement(paymentToken){
//   return new Promise(function(resolve, reject){
//     paypal.billingAgreement.execute(paymentToken, {}, function(error, billingAgreement) {
//         if (error) return reject(error);
//         resolve(billingAgreement);
//     });
//   });
// }
