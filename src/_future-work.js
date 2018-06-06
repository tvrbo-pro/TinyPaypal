
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
