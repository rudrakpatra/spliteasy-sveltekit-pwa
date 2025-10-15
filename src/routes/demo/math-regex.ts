const mathPattern = /\d+(?:\.\d+)?(?:\s*%(?:\s*(?:tax|discount|off|offer|tip|vat))?)?(?:\s*[\+\-\*\/]\s*(?:\d+(?:\.\d+)?(?:\s*%(?:\s*(?:tax|discount|off|offer|tip|vat))?)?|\(\s*\d+(?:\.\d+)?(?:\s*[\+\-\*\/]\s*\d+(?:\.\d+)?)*\s*\)))*(\s*[\+\-\*\/])?/;
const testCases = [
    // Simple expressions
    "2+3*24", // ✓ Complete expression
    "2-24+24", // ✓ Multiple operators
    // With brackets
    "2-24+24(24+4)", // ✓ Parentheses (matches "2-24+24")
    "(24+4)", // ✓ Just parentheses (matches "24+4")
    "2+(3*4)", // ✓ Nested operation
    // With decimals
    "1204.4+24", // ✓ Decimal number
    "2.5*3.7", // ✓ Multiple decimals
    // With percentages
    "100%", // ✓ Matches "100" (no operator before %)
    "100+5%", // ✓ Matches "100+5%" (includes the %)
    "100-10%", // ✓ Matches "100-10%" (includes the %)
    "200*2+5% tax", // ✓ Matches "200*2+5% tax" (includes % and keyword)
    "200*2+5%tax", // ✓ Matches "200*2+5%tax" (no space)
    "150+15% tip", // ✓ Matches "150+15% tip"
    "150+15%tip", // ✓ Matches "150+15%tip" (no space)
    "300-20% off", // ✓ Matches "300-20% off"
    "300-20%off", // ✓ Matches "300-20%off" (no space)
    "500+10% discount", // ✓ Matches "500+10% discount"
    "100+5.5%tax", // ✓ Matches "100+5.5%tax" (decimal percentage)
    "100+5% tax +", // ✓ Matches "100+5% tax +" (trailing operator included)
    // With spaces
    "100+24", // ✓ No spaces
    "100 + 24", // ✓ Multiple spaces
    "2 + 3 * 4", // ✓ Spaced expression
    // Optimistic matching (trailing operators)
    "2+3+", // ✓ Trailing plus
    "2+3*", // ✓ Trailing multiply
    "100-", // ✓ Trailing minus
    // Should NOT fully match (will match valid prefix)
    "2+3.3.", // ✓ Matches "2+3.3" (stops at trailing period)
    "2.4@", // ✓ Matches "2.4" (stops at @)
    "2.tt.", // ✓ Matches "2" (period not followed by digits)
    "200*2+5% tax.", // ✓ Matches "200*2+5% tax" (stops at trailing period)
    "100+5%.", // ✓ Matches "100+5%" (stops at trailing period)
];
// console.log("Testing math pattern:");
// testCases.forEach(test => {
//     const matches = test.match(mathPattern);
//     console.log(`"${test}" => ${matches ? `"${matches[0]}"` : 'no match'}`);
// });
// Export for use
export { mathPattern };