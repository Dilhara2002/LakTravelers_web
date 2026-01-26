import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const CurrencyContext = createContext();

export const CurrencyProvider = ({ children }) => {
  // Initial currency set to LKR
  const [currency, setCurrency] = useState('LKR');
  
  // Default rates to show initially (until the API loads)
  const [rates, setRates] = useState({ LKR: 1, USD: 0.0033, EUR: 0.0031 });

  // ✅ Flag URLs to be displayed in the Navbar are included here
  const flags = {
    LKR: "https://flagcdn.com/w40/lk.png",
    USD: "https://flagcdn.com/w40/us.png",
    EUR: "https://flagcdn.com/w40/eu.png"
  };

  /**
   * Fetch real-time foreign exchange rates
   */
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await axios.get('https://open.er-api.com/v6/latest/LKR');
        if (res.data && res.data.rates) {
          setRates(res.data.rates);
        }
      } catch (err) {
        console.error("Currency fetch failed:", err);
      }
    };
    fetchRates();
  }, []);

  /**
   * 💰 Function to convert any LKR price to the selected currency and format it
   */
  const formatPrice = (lkrAmount) => {
    if (!lkrAmount) return "Rs. 0";
    
    const converted = lkrAmount * (rates[currency] || 1);
    
    // Selecting the relevant symbol for the currency
    const symbol = currency === 'LKR' ? 'Rs.' : currency === 'USD' ? '$' : '€';
    
    // Displaying without decimal places (or with decimals only if necessary)
    return `${symbol} ${converted.toLocaleString(undefined, { 
      maximumFractionDigits: 0 
    })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, flags }}>
      {children}
    </CurrencyContext.Provider>
  );
};

// Custom Hook for easy usage
export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
};