function validateOutput(output, rules) {
    const results = [];

    for (const rule of rules) {
        if (rule === 'no external dependencies') {
            if (/require\(['"](axios|node-fetch|request)['"]\)/.test(output)) {
                results.push({ rule, status: 'FAIL', reason: 'External dependency found' });
            } else {
                results.push({ rule, status: 'PASS' });
            }
        }

        if (rule === 'use async/await') {
            if (!/async|await/.test(output)) {
                results.push({ rule, status: 'FAIL', reason: 'No async/await used' });
            } else {
                results.push({ rule, status: 'PASS' });
            }
        }

        if (rule === 'no console logs') {
            if (/console\.log/.test(output)) {
                results.push({ rule, status: 'FAIL', reason: 'console.log found' });
            } else {
                results.push({ rule, status: 'PASS' });
            }
        }
    }

    return results;
}

function validateAll(outputs, rules = []) {
    if (!rules.length) return {};

    const validation = {};

    for (const key of Object.keys(outputs)) {
        if (!outputs[key]) continue;
        validation[key] = validateOutput(outputs[key], rules);
    }

    return validation;
}

module.exports = { validateAll };
