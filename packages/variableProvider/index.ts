import variables from './variables.json';

export function getENVValue(variableName : keyof typeof variables.variables) : string | null {
    const value = process.env[variableName] || variables.variables[variableName];

    if(value) {
        return value;
    }

    console.log(`The variable ${variableName} does not seem to exist`);
    return null;
}