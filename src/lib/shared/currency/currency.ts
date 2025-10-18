import { CURRENCY_MAP, COUNTRY_MAP, type CountryCode, type Currency, CURRENCY_ENUM, currencies, type CurrencyCode } from './currency-codes';
import { withTimeout } from '$lib/utils';
import z from 'zod';
/**
 * IP-based detection 
 * pros (simple)
 * cons (user may use VPN)
 */
async function getLocationFromIP(): Promise<Currency | null> {
    try {
        console.warn("Requesting ipapi.co/json/")
        const response = await withTimeout(fetch('https://ipapi.co/json/'), 2000);
        if (response.ok) {
            const { country_code, currency } = await response.json();
            console.info("Response ipapi.co/json/", { country_code, currency })
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
            const response = await withTimeout(fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
            ), 2000);

            if (response.ok) {
                const data = await response.json();
                console.info("Response bigdatacloud.net/data/reverse-geocode-client", data)
                return COUNTRY_MAP.get(data.countryName) || null;
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
    const promises = [
        getCurrencyFromGeolocation(),
        getLocationFromIP(),
        Promise.resolve(detectCurrencyByLanguage()),
    ];

    const results = await Promise.all(promises);

    const suggestions = new Map<string, Currency>(); // Use Map for deduplication by code

    results.forEach(result => {
        if (result && !suggestions.has(result.code)) {
            suggestions.set(result.code, result);
        }
    });

    return Array.from(suggestions.values());
}

export const currencyCodeSchema = z.enum(Object.values(currencies).map((currency) => currency.code));

export const currencySymbol = (currency: Currency) => {
    const locale = navigator.language;
    return Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency.code,
        currencyDisplay: 'narrowSymbol',
    }).format(1).replace(/\d./g, '');
}

export const currencyLabel = (currency: Currency) => {
    return `${currency.currency} (${currencySymbol(currency)})`
}

export const currencyFormat = (currency: Currency | CurrencyCode, amount: number) => {
    const locale = navigator.language;
    let code = "USD"
    if (typeof currency === 'string') code = currency
    else if (currency) code = currency.code
    return Intl.NumberFormat(locale, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'narrowSymbol',
    }).format(amount)
}