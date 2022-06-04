import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'child_process';
import rimraf from 'rimraf';
import * as path from 'path';
import { readFileSync, writeFileSync } from 'fs';

const containerBaseName = 'rdmchr/carla-';

async function getScope() {
    return inquirer.prompt([ {
        type: 'list',
        name: 'scope',
        message: 'Select which scope you want to build',
        choices: [
            'Bot',
            'Web',
            'Server',
            'Social-Cache'
        ],
    },
    ]);
}

async function getVersion(version: string) {
    return inquirer.prompt([ {
        type: 'input',
        name: 'version',
        message: 'What should this version be called? (Current version is ' + chalk.green(version) + ')',
    } ]);
}

async function prune(scope: string) {
    console.log(chalk.green('Creating clean directory containing only the selected scope...'));
    return new Promise<void>((resolve, reject) => {
        exec('npx turbo prune --docker --scope=@carla/' + scope, {cwd: '../../'}, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                reject();
            }
            console.log(`${stdout}`);
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }
            resolve();
        });
    });
}

async function build(scope: string, version: string) {
    console.log(chalk.green('Building Docker container...'));
    return new Promise<void>((resolve, reject) => {
        exec(`docker build -t ${containerBaseName}${scope}:${version} --no-cache -f ${scope}.Dockerfile .`, {cwd: `../../`}, (error, stdout, stderr) => {
            if (error) {
                handleError(error);
                reject();
            }
            console.log(`${stdout}`);
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }
            resolve();
        });
    });
}

async function createLatest(scope: string, version: string) {
    console.log(chalk.green('Creating latest tag...'));
    return new Promise<void>((resolve, reject) => {
        exec(`docker tag ${containerBaseName}${scope}:${version} ${containerBaseName}${scope}:latest`, {cwd: `../../`}, (error, stdout, stderr) => {
            if (error) {
                handleError(error);
                reject();
            }
            console.log(`${stdout}`);
            if (stderr) {
                console.log(`stderr: ${stderr}`);
            }
            resolve();
        });
    });
}

async function waitForConfirmation() {
    return inquirer.prompt([ {
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to continue?',
    } ]);
}

async function removeOldData() {
    console.log(chalk.green('Removing old data...'));
    const rootPath = path.join(process.cwd(), '../../');
    const rootFolder = rootPath.replaceAll('\\', '').replaceAll('/', '');
    if (!rootFolder.endsWith('CarlaBot')) {
        console.log(chalk.red.bold(`It seems like this script was not run in the right path (path is ${rootPath} and doesn\'t end with 'carla-bot'). Are you sure you want to continue? This could lead to file loss.`));
        const {confirm} = await waitForConfirmation();
        if (confirm !== true) {
            console.log(chalk.red('Exiting...'));
            process.exit(1);
            return;
        }
    }
    return new Promise<void>((resolve, reject) => {
        rimraf('../../out/', (error) => {
            if (error) {
                handleError(error);
                reject();
            }
            resolve();
        });
    });
}

async function writeVersionToProject(scope: string, version: string) {
    console.log(chalk.green('Writing version to constants.ts...'));
    const currentData = readFileSync(`../../out/full/apps/${scope}/src/constants.ts`, 'utf8');
    const newData = currentData.replace("DEBUG", version);
    writeFileSync(`../../out/full/apps/${scope}/src/constants.ts`, newData, 'utf8');
}

async function writeVersionToFile(scope: string, version: string) {
    console.log(chalk.green('Writing version to versions.json...'));
    const currentData = readFileSync(path.join(process.cwd(), `versions.json`), 'utf8');
    const currentJson = JSON.parse(currentData);
    currentJson[scope] = version;
    writeFileSync(path.join(process.cwd(), `versions.json`), JSON.stringify(currentJson), 'utf8');
}

function handleError(error: Error) {
    console.error(chalk.red(error.message));
    process.exit(1);
}

function getCurrentVersion(scope: string) {
    console.log(chalk.green('Writing version to versions.json...'));
    const currentData = readFileSync(path.join(process.cwd(), `versions.json`), 'utf8');
    const currentJson = JSON.parse(currentData);
    return currentJson[scope];
}

async function main() {
    console.log(process.cwd())
    await removeOldData();
    const scopeRes = await getScope();
    const scope = scopeRes.scope.toLowerCase() as 'bot' | 'web' | 'server';
    const currVersion = getCurrentVersion(scope);
    const versionRes = await getVersion(currVersion);
    const version = versionRes.version as string;
    if (!version) {
        console.log(chalk.red('No version provided, exiting...'));
        return;
    }
    if (!version.match(/^[0-9]+\.[0-9]+\.[0-9]+$/)) {
        console.log(chalk.red('Invalid version format, exiting...'));
        return;
    }

    await prune(scope);
    await writeVersionToProject(scope, version);
    await build(scope, version);
    await createLatest(scope, version);
    await writeVersionToFile(scope, version);
    console.log(chalk.green(`Done! Successfully created ${containerBaseName}${scope}:${version} & ${containerBaseName}${scope}:latest`));
}

main();