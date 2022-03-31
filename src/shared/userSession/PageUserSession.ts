import {
    PageSettingsData,
    PageSettingsUpdate
} from "shared/api/session-service/sessionServiceModels";
import {computed, IReactionDisposer, makeAutoObservable, observable, reaction, toJS} from "mobx";
import sessionServiceClient from "shared/api/sessionServiceInstance";
import {AppStore} from "AppStore";
import _ from "lodash";

export enum PageType {
    RESULT_VIEW = 'result_view',
    STUDY_VIEW = 'study_view'
}

export type PageSettingsIdentifier = {
    page: PageType,
    origin: string[]
};

export interface IPageUserSession<T extends PageSettingsData> {
    readonly isLoggedIn: boolean;
    readonly isSavingUserPreferencePossible: boolean;
    id: PageSettingsIdentifier;
    userSettings: T | undefined;
    updateUserSettings: (userSettings: T | undefined) => void;
}

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {

    @observable public id: PageSettingsIdentifier;
    @observable public userSettings: T | undefined;
    @observable private previousUserSettings: T | undefined;

    private reactionDisposers: IReactionDisposer[] = [];

    constructor(
        private appStore: AppStore,
        private sessionServiceIsEnabled: boolean
    ) {

        makeAutoObservable(this);

        this.reactionDisposers.push(
            reaction(
                () => [
                    this.id,
                    this.isSavingUserPreferencePossible
                ],
                async () => {
                    if (this.isSavingUserPreferencePossible
                        && this.id.origin.length
                    ) {
                        this.userSettings = await sessionServiceClient
                            .fetchPageSettings<T>(this.id);
                    }
                }
            )
        );
    }

    public async updateUserSettings(userSettings: T | undefined) {
        userSettings = toJS(userSettings);
        if(!this.isSavingUserPreferencePossible) {
            return;
        }
        if (!userSettings || _.isEqual(toJS(this.userSettings), userSettings)) {
            return;
        }

        const update = {
            ...this.id,
            ...userSettings
        } as PageSettingsUpdate;
        await sessionServiceClient.updateUserSettings(update);

        this.userSettings = userSettings;
    }

    destroy() {
        this.reactionDisposers.forEach(disposer => disposer());
    }

    @computed get isSavingUserPreferencePossible() {
        return this.isLoggedIn && this.sessionServiceIsEnabled;
    }

    @computed get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

}