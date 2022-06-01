import variables from './variables.json';

export function getEnvValue(variableName: keyof typeof variables.variables): string | null {
    const value = process.env[variableName] || variables.variables[variableName];

    if (value) {
        return value;
    }

    console.warn(`The variable ${variableName} does not seem to exist`);
    return null;
}