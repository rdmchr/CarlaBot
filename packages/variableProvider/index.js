import variables from './variables.json';
export function getENVValue(variableName) {
    const value = process.env[variableName] || variables.variables[variableName];
    if (value) {
        return value;
    }
    console.log(`The variable ${variableName} does not seem to exist`);
    return null;
}
