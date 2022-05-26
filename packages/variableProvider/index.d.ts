import variables from './variables.json';
export declare function getENVValue(variableName: keyof typeof variables.variables): string | null;
