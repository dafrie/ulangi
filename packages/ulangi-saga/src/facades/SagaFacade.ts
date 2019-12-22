/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import NetInfo from '@react-native-community/netinfo';
import { SQLiteDatabaseAdapter } from '@ulangi/sqlite-adapter';
import {
  DatabaseEventBus,
  DatabaseFacade,
  ModelFactory,
  ModelList,
} from '@ulangi/ulangi-local-database';
import * as FileSystem from 'react-native-fs';
import * as Iap from 'react-native-iap';
import sagaMiddlewareFactory, { SagaMiddleware } from 'redux-saga';

import { AdMobAdapter } from '../adapters/AdMobAdapter';
import { AppsFlyerAdapter } from '../adapters/AppsFlyerAdapter';
import { CrashlyticsAdapter } from '../adapters/CrashlyticsAdapter';
import { FirebaseAdapter } from '../adapters/FirebaseAdapter';
import { NotificationsAdapter } from '../adapters/NotificationsAdapter';
import { SystemDarkModeAdapter } from '../adapters/SystemDarkModeAdapter';
import { SagaConfig } from '../interfaces/SagaConfig';
import { RootSaga } from '../sagas/RootSaga';

export class SagaFacade {
  private sagaMiddlware = sagaMiddlewareFactory();

  private config: SagaConfig;

  private database: DatabaseFacade;
  private firebase: FirebaseAdapter;
  private adMob: AdMobAdapter;
  private appsFlyer: AppsFlyerAdapter;
  private netInfo: typeof NetInfo;
  private fileSystem: typeof FileSystem;
  private iap: typeof Iap;
  private notifications: NotificationsAdapter;
  private systemDarkMode: SystemDarkModeAdapter;
  private crashlytics: CrashlyticsAdapter;

  private databaseEventBus: DatabaseEventBus;
  private modelList: ModelList;

  public constructor(
    config: SagaConfig,
    sqliteDatabase: SQLiteDatabaseAdapter,
    firebase: FirebaseAdapter,
    adMob: AdMobAdapter,
    appsFlyer: AppsFlyerAdapter,
    netInfo: typeof NetInfo,
    fileSystem: typeof FileSystem,
    iap: typeof Iap,
    notifications: NotificationsAdapter,
    systemDarkMode: SystemDarkModeAdapter,
    crashlytics: CrashlyticsAdapter
  ) {
    this.config = config;

    // Create facades & adapters
    this.database = new DatabaseFacade(sqliteDatabase);
    this.firebase = firebase;
    this.adMob = adMob;
    this.appsFlyer = appsFlyer;
    this.netInfo = netInfo;
    this.fileSystem = fileSystem;
    this.iap = iap;
    this.notifications = notifications;
    this.systemDarkMode = systemDarkMode;
    this.crashlytics = crashlytics;

    this.databaseEventBus = new DatabaseEventBus();
    this.modelList = new ModelFactory(this.databaseEventBus).createAllModels();
  }

  public getMiddleware(): SagaMiddleware<{}> {
    return this.sagaMiddlware;
  }

  public run(): void {
    const root = new RootSaga(
      this.database,
      this.firebase,
      this.fileSystem,
      this.iap,
      this.adMob,
      this.appsFlyer,
      this.netInfo,
      this.notifications,
      this.systemDarkMode,
      this.crashlytics,
      this.databaseEventBus,
      this.modelList
    );

    this.sagaMiddlware.run((): IterableIterator<any> => root.run(this.config));
  }
}
