import { CURRENCY_MAP, COUNTRY_MAP, type CountryCode, type Currency, CURRENCY_ENUM } from './currency-codes';
import { withTimeout } from '$lib/utils';
/**
 * IP-based detection 
 * pros (simple)
 * cons (user may use VPN)
 */
async function getLocationFromIP(): Promise<Currency | null> {
    try {
        console.warn("Requesting ipapi.co/json/")
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const { country_code, currency } = await response.json();
            console.warn("Response ipapi.co/json/", { country_code, currency })
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
async function getCurrencyFromGeolocation(): Promise<Currency | null> {
    try {
        if ('geolocation' in navigator) {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: false,
                });
            });

            const { latitude, longitude } = position.coords;

            console.warn("Requesting bigdatacloud.net/data/reverse-geocode-client")
            const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            );

            if (response.ok) {
                const data = await response.json();
                console.warn("Response bigdatacloud.net/data/reverse-geocode-client", data)
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
 * Returns an array of suggested currencies based on multiple detection strategies
 */
export async function getCurrencySuggestions(): Promise<Currency[]> {
    const suggestions = new Map<string, Currency>(); // Use Map for deduplication by code

    // Strategy 1: Try geolocation first (most accurate)
    try {
        const geoCurrency = await withTimeout(getCurrencyFromGeolocation(), 2000);
        if (geoCurrency) {
            suggestions.set(geoCurrency.code, geoCurrency);
        }
    } catch (error) {
        console.warn('Geolocation detection failed:', error);
    }

    // Strategy 2: Try IP-based detection
    try {
        const ipCurrency = await withTimeout(getLocationFromIP(), 2000);
        if (ipCurrency && !suggestions.has(ipCurrency.code)) {
            suggestions.set(ipCurrency.code, ipCurrency);
        }
    } catch (error) {
        console.warn('IP detection failed:', error);
    }

    // Strategy 3: Try browser language detection
    try {
        const langCurrency = detectCurrencyByLanguage();
        if (langCurrency && !suggestions.has(langCurrency.code)) {
            suggestions.set(langCurrency.code, langCurrency);
        }
    } catch (error) {
        console.warn('Language detection failed:', error);
    }
    return Array.from(suggestions.values());
}
