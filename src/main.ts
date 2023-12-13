import { Platform, Plugin } from 'obsidian';
import {
  CustomFileExtensionsSettingTab,
  CustomFileExtensionsSettings,
  DEFAULT_SETTINGS
} from './settings';

export default class CustomFileExtensions extends Plugin {
  private _settings: CustomFileExtensionsSettings;
  public get settings(): Readonly<CustomFileExtensionsSettings> {
    return this._settings;
  }

  async onload() {
    super.onload();
    await this.loadSettings();
    this.addSettingTab(new CustomFileExtensionsSettingTab(this.app, this));
    if (this._settings.allowMdOverride) {
      /**@ts-expect-error */
      this.app.viewRegistry.unregisterExtensions(["md"]);
    }
    this._apply(this.settings.types);
  }

  onunload() {
    this._unapply(this._settings.types, true);

    // reset the default:
    try {
      this.registerExtensions([".md"], 'markdown');
    } catch { }
  }

  async loadSettings() {
    this._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async updateSettings(newSettings: CustomFileExtensionsSettings) {
    this._unapply(this._settings.types, newSettings.allowMdOverride);
    this._settings = newSettings;

    await this.saveData(this._settings);
    if (Platform.isMobile && this._settings.mobileSettings.enabled) {
      this._apply(this._settings.mobileSettings.types
        ?? this._settings.types);
    } else {
      this._apply(this._settings.types);
    }
  }

  private _apply(extensionsByViewType: Record<string, Array<string>>) {
    this._settings.errors = {};
    for (const view in extensionsByViewType) {
      for (const fileType of this.settings.types[view]) {
        this._tryToApply(fileType.toLowerCase(), view);
      }
    }
  }

  private _unapply(extensionsByViewType: Record<string, Array<string>>, allowMdOverride: boolean) {
    for (const extension of Object.values(extensionsByViewType).flat()) {
      if (allowMdOverride || extension !== "md") {
        try {
          /**@ts-expect-error */
          this.app.viewRegistry.unregisterExtensions([extension]);
        } catch {
          console.log("ERROR");
        }
      }
    }
  }

  private _tryToApply(fileType: string, view: string) {
    if (!this.settings.allowMdOverride && fileType === "md") {
      return;
    }

    try {
      this.registerExtensions([fileType], view);
    } catch (e) {
      /**@ts-expect-error */
      let current: string = this.app.viewRegistry.getTypeByExtension(fileType);

      let message;
      if (current) {
        message = `${fileType} is already registered to ${current}.`;
      } else {
        message = `${e}`;
      }

      message = `Could not register extension: '${fileType}' to view type: ${view}. ${message}`;

      new Notification("Error: Custom File Extensions Plugin", {
        body: message,
      });

      console.error(message);
      this._settings.errors[fileType] = message;
    }
  }
}
