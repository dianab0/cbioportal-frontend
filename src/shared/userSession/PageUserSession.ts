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
    readonly canSaveSession: boolean;

    /**
     * Changes exist between local and remote userSettings
     */
    isDirty: boolean;

    id: PageSettingsIdentifier;

    userSettings: T | undefined;

    /**
     * Update remote user session with local changes
     */
    saveUserSession: () => void;
}

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {
    private _id: PageSettingsIdentifier;
    private previousId: PageSettingsIdentifier | undefined;

    @observable
    public set id(id: PageSettingsIdentifier) {
        this._id = id;
    }

    public get id(): PageSettingsIdentifier {
        return this._id;
    }

    private _userSettings: T | undefined;

    /**
     * user settings as stored in user session
     */
    private sessionUserSettings: T | undefined;

    private reactionDisposers: IReactionDisposer[] = [];

    @observable
    public set userSettings(userSettings: T | undefined) {
        this._userSettings = userSettings;
    }

    destroy() {
        this.reactionDisposers.forEach(disposer => disposer());
    }

    public get userSettings(): T | undefined {
        return this._userSettings;
    }

    constructor(
        private appStore: AppStore,
        private sessionServiceIsEnabled: boolean
    ) {
        makeAutoObservable(this);

        this.reactionDisposers.push(
            reaction(
                () => [this.id, this.canSaveSession],
                async () => {
                    await this.fetchSessionUserSettings();
                }
            )
        );
    }

    @computed
    public get canSaveSession() {
        return this.isLoggedIn && this.sessionServiceIsEnabled;
    }

    @computed
    public get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    @computed
    public get isDirty(): boolean {
        return this.idIsDirty || this.userSettingsAreDirty;
    }

    @computed
    private get idIsDirty(): boolean {
        return !isEqualJs(this._id, this.previousId);
    }

    @computed
    private get userSettingsAreDirty(): boolean {
        return !isEqualJs(this._userSettings, this.sessionUserSettings);
    }

    /**
     * Fetch user settings from session
     * Note: does not set user settings
     */
    private async fetchSessionUserSettings() {
        const shouldFetch = this.canSaveSession && this.idIsDirty;

        if (shouldFetch) {
            this.sessionUserSettings = await sessionServiceClient.fetchPageSettings<
                T
            >(this.id);
            this.previousId = this.id;
        }
    }

    public async saveUserSession() {
        if (!this.isDirty || !this.canSaveSession) {
            return;
        }
        const update = {
            ...this.id,
            ...this.userSettings,
        } as PageSettingsUpdate;
        await sessionServiceClient.updateUserSettings(update);
        this.sessionUserSettings = this.userSettings;
        this.previousId = this.id;
    }
}

function isEqualJs(a: any, b: any) {
    return _.isEqualWith(toJS(a), toJS(b), nilIsEqual);
}

/**
 * Null is equal to undefined
 */
function nilIsEqual(a: any, b: any) {
    if (_.isNil(a) && _.isNil(b)) {
        return a == b;
    }
}
