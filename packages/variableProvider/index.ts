import variables from './variables.json' assert {type: "json"};

export function getEnvValue(variableName: keyof typeof variables.variables): string | null {
    const value = process.env[String(variableName)] || variables.variables[variableName];

    if (value) {
        return value;
    }

    console.warn(`The variable ${String(variableName)} does not seem to exist`);
    return null;
}