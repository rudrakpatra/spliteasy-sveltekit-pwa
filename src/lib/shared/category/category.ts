import z from "zod";

export const categories = {
    INCOME: {
        code: 'INCOME',
        name: 'Income',
        icon: '💰',
        description: 'Income',
    },
    RECEIPT: {
        code: 'RECEIPT',
        name: 'Receipt',
        icon: '🧾',
        description: 'Bills, Invoices & Receipts',
    },
    PAYMENT: {
        code: 'PAYMENT',
        name: 'Payment',
        icon: '💳',
        description: 'Transfers & Reimbursements',
    },
    GROCERIES: {
        code: 'GROCERIES',
        name: 'Groceries',
        icon: '🛒',
        description: 'Supermarket, food, and household supplies',
    },
    DINING: {
        code: 'DINING',
        name: 'Dining Out',
        icon: '🍽️',
        description: 'Restaurants, cafes, bars, and takeout',
    },
    TRANSPORT: {
        code: 'TRANSPORT',
        name: 'Transport',
        icon: '🚗',
        description: 'Public transport, taxis, fuel, parking',
    },
    UTILITIES: {
        code: 'UTILITIES',
        name: 'Utilities',
        icon: '💡',
        description: 'Electricity, water, gas, internet, phone',
    },
    RENT: {
        code: 'RENT',
        name: 'Rent',
        icon: '🏠',
        description: 'Apartment or house rent',
    },
    ENTERTAINMENT: {
        code: 'ENTERTAINMENT',
        name: 'Entertainment',
        icon: '🎬',
        description: 'Movies, concerts, events, streaming',
    },
    TRAVEL: {
        code: 'TRAVEL',
        name: 'Travel',
        icon: '✈️',
        description: 'Flights, hotels, trips, vacations',
    },
    HEALTH: {
        code: 'HEALTH',
        name: 'Health & Fitness',
        icon: '🏥',
        description: 'Medical, pharmacy, gym, wellness',
    },
    GIFTS: {
        code: 'GIFTS',
        name: 'Gifts & Donations',
        icon: '🎁',
        description: 'Gifts, charity, donations',
    },
    SHOPPING: {
        code: 'SHOPPING',
        name: 'Shopping',
        icon: '🛍️',
        description: 'Clothes, electronics, personal items',
    },
    EDUCATION: {
        code: 'EDUCATION',
        name: 'Education',
        icon: '🎓',
        description: 'Books, courses, tuition',
    },
    OTHER: {
        code: 'OTHER',
        name: 'Other',
        icon: '🔖',
        description: 'Miscellaneous expenses',
    },
} as const;

export type Category = typeof categories[keyof typeof categories];

export const categorySchema = z.enum(Object.values(categories).map((category) => category.code));

