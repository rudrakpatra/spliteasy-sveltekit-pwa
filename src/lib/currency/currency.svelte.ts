import { createQuery } from '@tanstack/svelte-query';
import { CURRENCY_MAP, COUNTRY_MAP, DEFAULT_CURRENCY, type CurrencyCode, type CountryCode, type Currency, CURRENCY_ENUM } from './currency-codes';

/**
 * IP-based detection 
 * pros (simple)
 * cons (user may use VPN)
 */
async function getLocationFromIP(): Promise<Currency | null> {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const { country_code, currency } = await response.json();
            return COUNTRY_MAP.get(country_code) || CURRENCY_MAP.get(currency) || null;
        }
    } catch (error) {
        console.warn('IP geolocation failed:', error);
    }
    return null;
}
/**
 * Geolocation-based detection
 * pros (most accurate)
 * cons (requires user permission)
 */
async function getCurrecnyFromGeolocation(): Promise<Currency | null> {
    try {
        if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: false,
                });
            });

            const { latitude, longitude } = position.coords;

            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );

            if (response.ok) {
                const data = await response.json();
                return COUNTRY_MAP.get(data.countryCode) || null;
            }
        }
    } catch (error) {
        console.warn('Geolocation failed:', error);
    }
    return null;
}


/**
 * Browser language detection
 * pros (simple)
 * cons (not accurate)
 */
function detectCurrencyByLanguage(): Currency | null {
    try {
        const language = navigator.language.toLowerCase();
        const countryCode = language.split('-')[1]?.toUpperCase() as CountryCode;
        if (countryCode && COUNTRY_MAP.has(countryCode))
            return COUNTRY_MAP.get(countryCode) || null;
        if (['en', 'de', 'fr', 'it', 'es', 'pt', 'nl'].some(lang => language.startsWith(lang))) return CURRENCY_ENUM.EUR;
        if (language.startsWith('ja')) return CURRENCY_ENUM.JPY;
        if (language.startsWith('zh')) return CURRENCY_ENUM.CNY;
        if (['hi', 'mr', 'gu', 'bn'].some(lang => language.startsWith(lang))) return CURRENCY_ENUM.INR;
        if (language.startsWith('ko')) return CURRENCY_ENUM.KRW;
    } catch (error) {
        console.warn('Language detection failed:', error);
    }
    return null;
}

/**
 * Main currency detection function
 * 
 */
export async function getCurrencySuggestions(): Promise<Set<Currency>> {
    const suggestions: Set<Currency> = new Set();

    // Strategy 1: Try geolocation first (most accurate)
    try {
        const geoCurrency = await getCurrecnyFromGeolocation()
        geoCurrency && suggestions.add(geoCurrency);
    } catch (error) {
        console.warn('Geolocation detection failed:', error);
    }

    // Strategy 2: Try IP-based detection
    try {
        const ipCurrency = await getLocationFromIP()
        ipCurrency && suggestions.add(ipCurrency);
    } catch (error) {
        console.warn('IP detection failed:', error);
    }

    // Strategy 3: Try browser language detection
    try {
        const langCurrency = detectCurrencyByLanguage();
        langCurrency && suggestions.add(langCurrency);
    } catch (error) {
        console.warn('Language detection failed:', error);
    }

    return suggestions;
}

// Svelte 5 runes style reactive variables for currency state
export const useCurrencySuggestions = () => {
    return createQuery(() => ({
        queryKey: ['currency', 'locale'],
        queryFn: getCurrencySuggestions,
        initialData: new Set<Currency>(),
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    }));
};