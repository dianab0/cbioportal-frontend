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
import { IPageUserSession } from 'shared/userSession/IPageUserSession';
import { PageSettingsIdentifier } from './PageSettingsIdentifier';

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
        const dirtyUserSettings = !isEqualJs(
            this._userSettings,
            this.sessionUserSettings
        );
        const dirtyId = !isEqualJs(this._id, this.previousId);
        return dirtyUserSettings || dirtyId;
    }

    private async fetchSessionUserSettings() {
        const shouldFetch = this.canSaveSession && this.isDirty;

        if (shouldFetch) {
            this.sessionUserSettings = await sessionServiceClient.fetchPageSettings<
                T
            >(this.id);
            this.userSettings = this.sessionUserSettings;
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
 * @returns {true|undefined}
 *  true when both null or undefined;
 *  undefined to use default comparator
 */
function nilIsEqual(a: any, b: any) {
    if (_.isNil(a) && _.isNil(b)) {
        return true;
    } else {
        return undefined;
    }
}
