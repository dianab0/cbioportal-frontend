import {
    PageSettingsData,
    PageSettingsUpdate,
} from 'shared/api/session-service/sessionServiceModels';
import {
    computed,
    IReactionDisposer,
    makeAutoObservable,
    observable,
    reaction,
    toJS,
} from 'mobx';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import { AppStore } from 'AppStore';
import _ from 'lodash';

export enum PageType {
    RESULT_VIEW = 'result_view',
    STUDY_VIEW = 'study_view',
}

export type PageSettingsIdentifier = {
    page: PageType;
    origin: string[];
};

export interface IPageUserSession<T extends PageSettingsData> {
    readonly isLoggedIn: boolean;
    readonly sessionSavingPossible: boolean;
    id: PageSettingsIdentifier;
    userSettings: T | undefined;
}

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {
    /**
     * Does a user want to save to user session?
     */
    @observable public sessionSavingDesired: boolean = false;

    @observable public id: PageSettingsIdentifier;

    @observable public userSettings: T | undefined;

    private reactionDisposers: IReactionDisposer[] = [];

    constructor(
        private appStore: AppStore,
        private sessionServiceIsEnabled: boolean
    ) {
        makeAutoObservable(this);

        /**
         * When userSettings change:
         * - save to session id
         * When ID changes:
         * - fetch new session
         *   - what if none?
         *     -> ? store current userSettings?
         *   - what if mismatch between session and query url?
         *     -> ? overwrite session with query url?
         */
        this.reactionDisposers.push(
            reaction(
                () => [this.savingToSession, this.id],
                async () => {
                    if (this.savingToSession) {
                        this.userSettings = await sessionServiceClient.fetchPageSettings<
                            T
                        >(this.id);
                    }
                }
            )
        );
        this.reactionDisposers.push(
            reaction(
                () => [this.savingToSession, this.userSettings],
                async () => {
                    await this.updateUserSession();
                }
            )
        );
    }

    /**
     * Is session saving possible and desired?
     */
    @computed
    public get savingToSession() {
        return (
            this.sessionSavingPossible &&
            this.sessionSavingDesired &&
            this.id?.origin?.length
        );
    }

    private async updateUserSession() {
        let shouldUpdate = this.savingToSession && this.userSettings;

        if (!shouldUpdate) {
            return;
        }

        const update = {
            ...this.id,
            ...this.userSettings,
        } as PageSettingsUpdate;
        await sessionServiceClient.updateUserSettings(update);
    }

    destroy() {
        this.reactionDisposers.forEach(disposer => disposer());
    }

    @computed get sessionSavingPossible() {
        return this.isLoggedIn && this.sessionServiceIsEnabled;
    }

    @computed get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }
}
