// Fetch currency conversion rates using exchangerate-api.com
const fetchConversionRate = async (fromCurrency, toCurrency) => {
  try {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1;
    }

    // Fetch rates from the source currency
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
    );
    const data = await response.json();

    if (data.rates && data.rates[toCurrency]) {
      return data.rates[toCurrency];
    } else {
      // Fallback with mock data if API fails
      const mockRates = {
        "USD-EUR": 0.85,
        "USD-GBP": 0.73,
        "USD-JPY": 110,
        "USD-NGN": 1500,
        "USD-CAD": 1.25,
        "USD-AUD": 1.35,
        "EUR-USD": 1.18,
        "EUR-GBP": 0.86,
        "GBP-USD": 1.37,
        "GBP-EUR": 1.16,
        "NGN-USD": 0.00067,
        "CAD-USD": 0.8,
        "AUD-USD": 0.74,
      };
      const rateKey = `${fromCurrency}-${toCurrency}`;
      const reverseKey = `${toCurrency}-${fromCurrency}`;

      if (mockRates[rateKey]) {
        return mockRates[rateKey];
      } else if (mockRates[reverseKey]) {
        return 1 / mockRates[reverseKey];
      } else {
        return 1.0;
      }
    }
  } catch (error) {
    console.error("Error fetching conversion rate:", error);
    // Fallback with mock data
    const mockRates = {
      "USD-EUR": 0.85,
      "USD-GBP": 0.73,
      "USD-JPY": 110,
      "USD-NGN": 1500,
      "USD-CAD": 1.25,
      "USD-AUD": 1.35,
      "EUR-USD": 1.18,
      "EUR-GBP": 0.86,
      "GBP-USD": 1.37,
      "GBP-EUR": 1.16,
      "NGN-USD": 0.00067,
      "CAD-USD": 0.8,
      "AUD-USD": 0.74,
    };
    const rateKey = `${fromCurrency}-${toCurrency}`;
    const reverseKey = `${toCurrency}-${fromCurrency}`;

    if (mockRates[rateKey]) {
      return mockRates[rateKey];
    } else if (mockRates[reverseKey]) {
      return 1 / mockRates[reverseKey];
    } else {
      return 1.0;
    }
  }
};

export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  const rate = await fetchConversionRate(fromCurrency, toCurrency);
  return amount * rate;
};

// Currency information with symbols and names
export const currencies = {
  USD: { name: "US Dollar", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  GBP: { name: "British Pound", symbol: "£" },
  JPY: { name: "Japanese Yen", symbol: "¥" },
  AUD: { name: "Australian Dollar", symbol: "A$" },
  CAD: { name: "Canadian Dollar", symbol: "C$" },
  CHF: { name: "Swiss Franc", symbol: "CHF" },
  CNY: { name: "Chinese Yuan", symbol: "¥" },
  SEK: { name: "Swedish Krona", symbol: "kr" },
  NZD: { name: "New Zealand Dollar", symbol: "NZ$" },
  MXN: { name: "Mexican Peso", symbol: "$" },
  SGD: { name: "Singapore Dollar", symbol: "S$" },
  HKD: { name: "Hong Kong Dollar", symbol: "HK$" },
  NOK: { name: "Norwegian Krone", symbol: "kr" },
  TRY: { name: "Turkish Lira", symbol: "₺" },
  RUB: { name: "Russian Ruble", symbol: "₽" },
  INR: { name: "Indian Rupee", symbol: "₹" },
  BRL: { name: "Brazilian Real", symbol: "R$" },
  ZAR: { name: "South African Rand", symbol: "R" },
  KRW: { name: "South Korean Won", symbol: "₩" },
  NGN: { name: "Nigerian Naira", symbol: "₦" },
  GHS: { name: "Ghanaian Cedi", symbol: "₵" },
  KES: { name: "Kenyan Shilling", symbol: "KSh" },
  EGP: { name: "Egyptian Pound", symbol: "£" },
  MAD: { name: "Moroccan Dirham", symbol: "د.م." },
  TZS: { name: "Tanzanian Shilling", symbol: "TSh" },
  UGX: { name: "Ugandan Shilling", symbol: "USh" },
  ZMW: { name: "Zambian Kwacha", symbol: "ZK" },
  BWP: { name: "Botswana Pula", symbol: "P" },
  MWK: { name: "Malawian Kwacha", symbol: "MK" },
  RWF: { name: "Rwandan Franc", symbol: "RF" },
  ETB: { name: "Ethiopian Birr", symbol: "Br" },
  XOF: { name: "West African CFA Franc", symbol: "CFA" },
  XAF: { name: "Central African CFA Franc", symbol: "CFA" },
  AOA: { name: "Angolan Kwanza", symbol: "Kz" },
  MZN: { name: "Mozambican Metical", symbol: "MT" },
  SLL: { name: "Sierra Leonean Leone", symbol: "Le" },
  LRD: { name: "Liberian Dollar", symbol: "L$" },
  GMD: { name: "Gambian Dalasi", symbol: "D" },
};

// Get currency symbol
export const getCurrencySymbol = (currencyCode) => {
  return currencies[currencyCode]?.symbol || currencyCode;
};

// Get currency name
export const getCurrencyName = (currencyCode) => {
  return currencies[currencyCode]?.name || currencyCode;
};

// Format currency amount with symbol
export const formatCurrencyAmount = (
  amount,
  currencyCode,
  showSymbol = true
) => {
  const symbol = showSymbol ? getCurrencySymbol(currencyCode) : "";
  const formattedAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places

  if (showSymbol) {
    return `${symbol}${formattedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } else {
    return formattedAmount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
};
