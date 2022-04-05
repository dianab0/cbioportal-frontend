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
    /**
     * Session saving is possible when:
     * - user is logged in;
     * - sessions are enabled
     */
    readonly sessionSavingPossible: boolean;

    /**
     * Does the current user want to save to user session?
     */
    sessionSavingDesired: boolean;

    id: PageSettingsIdentifier;
    userSettings: T | undefined;
}

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {
    @observable public sessionSavingDesired: boolean = false;

    private _id: PageSettingsIdentifier;
    private previousId: PageSettingsIdentifier;

    @observable
    public set id(id: PageSettingsIdentifier) {
        this._id = id;
    }

    public get id(): PageSettingsIdentifier {
        return this._id;
    }

    private _userSettings: T | undefined;
    private previousUserSettings: T | undefined;

    @observable
    public set userSettings(userSettings: T | undefined) {
        this.previousUserSettings = this._userSettings;
        this._userSettings = userSettings;
    }

    public get userSettings(): T | undefined {
        return this._userSettings;
    }

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
                    await this.fetchSessionPageSettings();
                }
            )
        );
        this.reactionDisposers.push(
            reaction(
                () => [this.savingToSession, this.userSettings],
                async () => {
                    await this.updateSessionPageSettings();
                }
            )
        );
    }

    private async fetchSessionPageSettings() {
        const idChanged = !isEqualJs(this._id, this.previousId);
        const shouldFetch = this.sessionServiceIsEnabled && idChanged;

        if (shouldFetch) {
            this.previousId = this._id;
            this.userSettings = await sessionServiceClient.fetchPageSettings<T>(
                this.id
            );
        }
    }

    private async updateSessionPageSettings() {
        const userSettingsChanged = !isEqualJs(
            this.userSettings,
            this.previousUserSettings
        );
        const shouldUpdate = this.savingToSession && userSettingsChanged;

        if (shouldUpdate) {
            const update = {
                ...this.id,
                ...this.userSettings,
            } as PageSettingsUpdate;
            this.previousUserSettings = this._userSettings;
            await sessionServiceClient.updateUserSettings(update);
        }
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

function isEqualJs(a: any, b: any) {
    return _.isEqual(toJS(a), toJS(b));
}
