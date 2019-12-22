/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

#!/usr/bin/env node

import { DictionaryFacade } from '@ulangi/ulangi-dictionary';
import { LibraryFacade } from '@ulangi/ulangi-library';
import * as AWS from 'aws-sdk';
import chalk from 'chalk';
import * as commander from 'commander';
import * as inquirer from 'inquirer';

import { loadConfig } from '../setup/loadConfig';

async function exec(): Promise<void> {
  const config = loadConfig();

  commander
    .option('-e, --endpoint <endpoint>', 'Elasticsearch endpoint')
    .option(
      '-l, --languageCodePairs <languageCodePairs>',
      'Language code pairs'
    )
    .parse(process.argv);

  const answers: any = await inquirer.prompt([
    {
      type: 'input',
      name: 'endpoint',
      message: 'Enter endpoint: ',
      default: commander.endpoint || 'http://localhost',
    },
    {
      type: 'input',
      name: 'languageCodePairsStr',
      message: 'Enter language code pairs (e.g. ja-en, ko-en): ',
      default:
        commander.languageCodePairs ||
        config.library.defaultLanguageCodePairs.join(', '),
    },
    {
      type: 'list',
      name: 'isAWS',
      message: 'Is this AWS Elasticsearch?:',
      choices: ['yes', 'no'],
      default: 'yes',
    },
    {
      when: (answers: any): boolean => answers.isAWS === 'yes',
      type: 'list',
      name: 'awsConfigLoading',
      choices: [
        { value: 'file', name: 'from the credential file' },
        { value: 'manually', name: 'set manually' },
      ],
      default: 'file',
      message:
        'Do you want to load AWS credentials from the ~./aws/credential file or set it manually?',
    },
    {
      when: (answers: any): boolean => answers.awsConfigLoading === 'manually',
      type: 'input',
      name: 'awsAccessKeyId',
      message: 'Enter access key:',
    },
    {
      when: (answers: any): boolean => answers.awsConfigLoading === 'manually',
      type: 'input',
      name: 'awsSecretKey',
      message: 'Enter secret key:',
    },
    {
      when: (answers: any): boolean => answers.isAWS === 'yes',
      type: 'list',
      name: 'region',
      choices: ['us-east-1', 'us-east-2', 'us-west-1', 'us-west-2', 'custom'],
      default: 'us-east-2',
      message: 'Select AWS region:',
    },
    {
      when: (answers: any): boolean => answers.region === 'custom',
      type: 'input',
      name: 'region',
      message: 'Enter AWS region:',
    },
  ]);

  const {
    endpoint,
    languageCodePairsStr,
    isAWS,
    awsConfigLoading,
    awsAccessKeyId,
    awsSecretKey,
    region,
  } = answers;

  const awsConfig =
    awsConfigLoading === 'manually'
      ? new AWS.Config({
          credentials: new AWS.Credentials(awsAccessKeyId, awsSecretKey),
          region,
        })
      : new AWS.Config({
          credentials: new AWS.SharedIniFileCredentials(),
          region,
        });

  try {
    const dictionary = new DictionaryFacade(endpoint, awsConfig);
    const library = new LibraryFacade(
      endpoint,
      dictionary,
      isAWS === 'yes' ? awsConfig : undefined
    );

    const languageCodePairs = languageCodePairsStr.split(',').map(
      (languageCodePair: string): string => {
        return languageCodePair.trim().replace(/\\ /g, ' ');
      }
    );

    for (const languageCodePair of languageCodePairs) {
      process.stdout.write(`Checking index for ${languageCodePair}... `);
      const existed = await library.indexForLanguagePairExists(
        languageCodePair
      );

      if (existed === false) {
        process.stdout.write(`Creating index... `);
        await library.createSetIndexByLanguagePair(languageCodePair);
        process.stdout.write(chalk.green('Succeeded.\n'));
      } else {
        process.stdout.write(chalk.red(`Already existed.\n`));
      }
    }
  } catch (error) {
    console.log(error);
    process.exit();
  }

  process.stdout.write(chalk.blue('Completed\n'));
  process.exit();
}

exec();
