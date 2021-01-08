const { GPayNative } = Capacitor.Plugins;

async function gpayInit() {
  //#region request base data
  const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
  };

  const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      gateway: 'example',
      gatewayMerchantId: 'exampleGatewayMerchantId',
    }
  };

  const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
      allowedCardNetworks: ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"],
    }
  };

  const cardPaymentMethod = {
    tokenizationSpecification,
    ...baseCardPaymentMethod,
  };
  //#endregion

  async function isReadyToPay() {
    const isReadyToPayRequest = {
      ...baseRequest,
      allowedPaymentMethods: [baseCardPaymentMethod],
    };
  
    const { isReady } = await GPayNative.isReadyToPay({ request: isReadyToPayRequest });
    return isReady;
  }

  async function loadPaymentData(price) {
    const paymentDataRequest = {
      ...baseRequest,
      allowedPaymentMethods: [cardPaymentMethod],
      transactionInfo: {
        totalPriceStatus: 'FINAL',
        totalPrice: Number(price).toFixed(2),
        currencyCode: 'USD',
        countryCode: 'US',
  
        checkoutOption: 'COMPLETE_IMMEDIATE_PURCHASE',
      },
      merchantInfo: {
        merchantName: 'Example Merchant', //'TEST',
        // merchantId: 'TEST', //'12345678901234567890', //'TEST'
      },
    };
  
    return await GPayNative.loadPaymentData({ request: paymentDataRequest });
  }

  // create PaymentsClient instance
  await GPayNative.createClient({ test: true });

  return {
    isReadyToPay,
    loadPaymentData,
  };
}

const payBtn = document.getElementById('gpaybtn');
const resContainer = document.getElementById('res_container');

gpayInit().then(async gpay => {
  if (!await gpay.isReadyToPay()) {
    payBtn.setAttribute('disabled', 'disabled');
    payBtn.innerHTML = 'Не доступно';
    return;
  }

  payBtn.addEventListener('click', async event => {
    event.preventDefault();
    
    payBtn.setAttribute('disabled', 'disabled');
    try {
      const data = await gpay.loadPaymentData(10.45);
      const resJsonFormat = JSON.stringify(data, null, '  ');
      resContainer.innerHTML = `<pre>${resJsonFormat}</pre>`;
    } catch (e) {
      if (e.message === 'canceled') {
        resContainer.innerHTML = "Вы закрыли окно оплаты";
      } else {
        resContainer.innerHTML = `Error: ${e.message}`;
      }
    } finally {
      payBtn.removeAttribute('disabled');
    }
  });
});

// События платежей
GPayNative.addListener('success', data => {
  console.log('Успешный платеж', data);
});

GPayNative.addListener('error', err => {
  console.log('Возникла ошибка', err.message);
});

GPayNative.addListener('canceled', () => {
  console.log('Пользователь передумал');
});


