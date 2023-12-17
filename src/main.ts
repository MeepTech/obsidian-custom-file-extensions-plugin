import { Notice, Platform, Plugin } from 'obsidian';
import {
  CustomFileExtensionsSettingTab,
  CustomFileExtensionsSettings,
  DEFAULT_SETTINGS
} from './settings';
import EditExtensionModal from './edit-modal';

export class CustomFileExtensions extends Plugin {
  private _settings: CustomFileExtensionsSettings;
  public get settings(): Readonly<CustomFileExtensionsSettings> {
    return this._settings;
  }

  public get useMobile(): boolean {
    return Platform.isMobile
      && this.settings.mobileSettings.enabled
  }

  async onload() {
    super.onload();
    await this.loadSettings();
    if (this._settings.allowMdOverride) {
      /**@ts-expect-error */
      this.app.viewRegistry.unregisterExtensions(["md"]);
    }

    this.registerEvent(this._buildFileContextMenuEditExtensionItem());
    this.addSettingTab(new CustomFileExtensionsSettingTab(this.app, this));

    this._apply();
  }

  private _buildFileContextMenuEditExtensionItem() {
    return this.app.workspace.on("file-menu", (menu, file) => {
      menu.addItem((item) => {
        item
          .setTitle("Edit Extension")
          .setIcon("pencil")
          .onClick(() =>
            new EditExtensionModal(
              this,
              file
            ).open()
          );
      });
    });
  }

  onunload() {
    this._unapply(this.settings);

    // reset the default:
    try {
      this.registerExtensions([".md"], 'markdown');
    } catch { }
  }

  async loadSettings() {
    this._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async resetSettings() {
    this._unapply(this.settings);
    await this.updateSettings(DEFAULT_SETTINGS);
    this._apply();
  }

  async updateSettings(newSettings: CustomFileExtensionsSettings) {
    this._unapply(newSettings);

    this._settings = newSettings;

    await this.saveData(this.settings);
    this._apply();
  }

  private _apply() {
    if (this.useMobile) {
      this._applyConfig(this.settings.mobileSettings.types ?? this.settings.types);
    } else {
      this._applyConfig(this.settings.types);
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

  private _applyConfig(extensionsByViewType: Record<string, Array<string>>) {
    this._settings.errors = {};
    for (const view in extensionsByViewType) {
      for (const fileType of extensionsByViewType[view]) {
        this._tryToApply(fileType.toLowerCase(), view);
      }
    }
  }

  private _unapply(newSettings: CustomFileExtensionsSettings) {
    if (this.useMobile) {
      this._unapplyConfig(this.settings.mobileSettings.types ?? this.settings.types, newSettings.allowMdOverride);
    } else {
      this._unapplyConfig(this.settings.types, newSettings.allowMdOverride);
    }
  }

  private _unapplyConfig(extensionsByViewType: Record<string, Array<string>>, allowMdOverride: boolean) {
    for (const extension of Object.values(extensionsByViewType).flat()) {
      if (allowMdOverride || extension !== "md") {
        if (!this._settings.errors[extension]) {
          try {
            /**@ts-expect-error */
            this.app.viewRegistry.unregisterExtensions([extension]);
          } catch {
            console.log("ERROR");
          }
        }
      }
    }
  }
}

export default CustomFileExtensions;