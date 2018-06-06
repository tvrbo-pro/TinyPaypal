const request = require('request-promise');
const Promise = require('bluebird');

const CLIENT_ID = Symbol('CLIENT_ID');
const CLIENT_SECRET = Symbol('CLIENT_SECRET');
const SUCCESS_CALLBACK_URL = Symbol('SUCCESS_CALLBACK_URL');
const CANCEL_CALLBACK_URL = Symbol('CANCEL_CALLBACK_URL');
const URL_PREFIX = Symbol('URL_PREFIX');
const CURRENCY = Symbol('CURRENCY');

class PayPal {
  [CLIENT_ID] = null;
  [CLIENT_SECRET] = null;
  [URL_PREFIX] = 'https://api.paypal.com'; // live
  [SUCCESS_CALLBACK_URL] = null;
  [CANCEL_CALLBACK_URL] = null;
  [CURRENCY] = "USD";

  constructor(clientId, clientSecret, defaults = { successCallbackUrl: null, cancelCallbackUrl: null, currency: null, sandbox: false }) {
    if (!clientId) throw new Error("The PayPal Client ID is required");
    else if (!clientSecret) throw new Error("The PayPal Client Secret is required");

    this[CLIENT_ID] = clientId;
    this[CLIENT_SECRET] = clientSecret;

    if (defaults) {
      if (defaults.sandbox)
        this[URL_PREFIX] = 'https://api.sandbox.paypal.com';
      if (defaults.successCallbackUrl)
        this[SUCCESS_CALLBACK_URL] = defaults.successCallbackUrl;
      if (defaults.cancelCallbackUrl)
        this[CANCEL_CALLBACK_URL] = defaults.cancelCallbackUrl;
      if (defaults.currency)
        this[CURRENCY] = defaults.currency;
    }
  }

  async createPayment({ amount, shipping = 0, discount = 0, discountText = "Discount", currency, description, successURL, cancelURL }) {
    if (!amount) throw ("Please, enter an amount of money to charge");
    else if (typeof amount !== 'number' || typeof shipping !== 'number' || typeof discount !== 'number') throw ("Amount, shipping and discount must be numerical values");
    else if (!description) throw ("Please, enter a description for the transaction as it should appear on PayPal");

    const accessToken = await this.getAccessToken();
    const itemList = [{
      name: description,
      // description: "description here",
      price: amount.toFixed(2),
      quantity: "1",
      // tax: "0.00",
      // sku: "#1234",
      currency: currency || this[CURRENCY]
    }];

    if (discount) {
      itemList.push({
        name: discountText,
        // description: "no description",
        price: `-${discount.toFixed(2)}`,
        quantity: "1",
        // tax: "0.00",
        // sku: "#1234",
        currency: currency || this[CURRENCY]
      });
    }

    const body = {
      transactions: [{
        item_list: {
          items: itemList
        },
        amount: {
          currency: currency || this[CURRENCY],
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
        return_url: successURL || this[SUCCESS_CALLBACK_URL],
        cancel_url: cancelURL || this[CANCEL_CALLBACK_URL]
      }
    };

    const payment = await request.post({
      uri: this[URL_PREFIX] + '/v1/payments/payment',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      },
      body,
      json: true
    });

    if (!payment || !payment.links) throw new Error("The transaction could not be created");

    const result = {
      id: payment.id
      // get
      // redirect
      // execute
    };

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
    if (!result.redirect)
      throw new Error("The transaction could not be created");

    return result;
  }

  async createCartPayment({ cart, shipping = 0, discount = 0, discountText = "Discount", currency, description, successURL, cancelURL }) {
    if (!cart || !Array.isArray(cart)) throw new Error("Please, provide an array of items to the cart");
    else if (!description) throw new Error("Please, provide a description for the transaction as it should appear on PayPal");

    let itemList = cart.map(item => {
      if (!item.name || typeof item.name !== 'string') throw new Error("The cart contains an item without a name");
      else if (!item.price || typeof item.price !== 'number') throw new Error("The cart contains an item without a numeric price");
      else if (item.quantity && typeof item.price !== 'number') throw new Error("The cart contains an item with a non-numeric quantity");

      return {
        name: item.name,
        description: item.description || "",
        price: item.price.toFixed(2),
        quantity: (item.quantity || 1).toString(),
        sku: item.sku || undefined,
        currency: currency || this[CURRENCY]
        // tax: "0.00"
      }
    });

    if (discount) {
      itemList.push({
        name: discountText,
        // description: "no description",
        price: `-${discount.toFixed(2)}`,
        quantity: "1",
        // tax: "0.00",
        // sku: "#1234",
        currency: currency || this[CURRENCY]
      });
    }

    // prices taken from the original cart array, not itemList
    const amount = cart.reduce((prev, cur) => prev + (cur.price * (cur.quantity || 1)), 0);

    const accessToken = await this.getAccessToken();
    const body = {
      transactions: [{
        item_list: {
          items: itemList
        },
        amount: {
          currency: currency || this[CURRENCY],
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
        description
      }],
      payer: {
        payment_method: "paypal"
      },
      intent: "sale",
      redirect_urls: {
        return_url: successURL || this[SUCCESS_CALLBACK_URL],
        cancel_url: cancelURL || this[CANCEL_CALLBACK_URL]
      }
    }

    const payload = {
      uri: this[URL_PREFIX] + '/v1/payments/payment',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      },
      body: body,
      json: true
    };

    const payment = await request.post(payload);

    if (!payment || !payment.links) throw new Error("The transaction could not be created");

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
    if (!result.redirect)
      throw new Error("The transaction could not be created");

    return result;
  }

  async executePayment(paymentId, token, payerId) {
    if (!paymentId || !token || !payerId) throw new Error("Invalid parameters");

    const accessToken = await this.getAccessToken();
    const payload = {
      uri: this[URL_PREFIX] + '/v1/payments/payment/' + paymentId + '/execute/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + accessToken
      },
      body: {
        payer_id: payerId
      },
      json: true
    };

    return request.post(payload);
  }

  // Internal functions

  async getAccessToken() {
    const payload = {
      uri: this[URL_PREFIX] + '/v1/oauth2/token',
      headers: {
        Authorization: 'Basic ' + new Buffer(this[CLIENT_ID] + ':' + this[CLIENT_SECRET]).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      },
      form: {
        grant_type: 'client_credentials'
      },
      json: true
    };

    const response = await request.post(payload);
    return response.access_token;
  }
}

module.exports = PayPal;
