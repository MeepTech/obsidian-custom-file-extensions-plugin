import { App, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import CustomFileExtensions from './main';

export interface CustomFileExtensionsSettings {
  types: Record<string, Array<string>>;
  configIsValid: boolean;
  allowMdOverride: boolean;
  errors: Record<string, string>;
  mobileSettings: Readonly<Omit<CustomFileExtensionsSettings, "mobileSettings" | "errors" | "allowMdOverride">> & {
    enabled: boolean;
  }
}

const _DEFAULT_TYPES = {
  "markdown": [
    "", "md", "txt",
    "js", "css", "ts",
    "jsx", "tsx", "yaml",
    "yml", "sass", "scss",
    "tex", "json", "html"
  ]
} as const;

export const DEFAULT_SETTINGS: Readonly<CustomFileExtensionsSettings> = {
  types: _DEFAULT_TYPES as unknown as Readonly<Record<string, Array<string>>>,
  configIsValid: true,
  errors: {},
  allowMdOverride: false,
  mobileSettings: {
    enabled: false,
    configIsValid: true,
    types: _DEFAULT_TYPES as unknown as Readonly<Record<string, Array<string>>>
  }
};

export class CustomFileExtensionsSettingTab extends PluginSettingTab {
  plugin: CustomFileExtensions;
  private _defaults?: {
    color: string;
    borderColor: string;
    borderWidth: string;
  } = undefined;
  private _errors: HTMLElement;

  constructor(app: App, plugin: CustomFileExtensions) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const example = JSON.stringify(DEFAULT_SETTINGS.types, null, 2);

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Custom File Extensions Settings' });
    new Setting(containerEl)
      .setName('Config')
      .setDesc("Valid entry is a JSON object who's property keys are view types and values are arrays of the file types to assign to that view. \n\tEX: " + example)
      .addTextArea(text => {
        text = text
          .setPlaceholder(example)
          .setValue(JSON.stringify(this.plugin.settings.types, null, 2))
          .onChange(async (value) => {
            let parsed: any = null;
            let next = {
              ...this.plugin.settings,
            };

            try {
              parsed = JSON.parse(value);
              next.configIsValid = true;
              next.types = parsed;
            } catch {
              next.configIsValid = false;
            }

            this._updateConfigValidity(text, this.plugin.settings.configIsValid, next.configIsValid);
            await this.plugin.updateSettings(next);
            this._updateErrors();
          });

        text.inputEl.style.width = "50%";
        return text;
      });

    new Setting(containerEl)
      .setName("Enable Mobile Specific Config")
      .setDesc("If true, the config settings below will be used on mobile devices instead of the above settings.")
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.mobileSettings.enabled)
          .onChange(async (value) => {
            let next = {
              ...this.plugin.settings,
              mobileSettings: {
                ...this.plugin.settings.mobileSettings,
                types: this.plugin.settings.mobileSettings.types
                  ?? this.plugin.settings.types
                  ?? _DEFAULT_TYPES,
                enabled: value
              }
            };
            await this.plugin.updateSettings(next);
            this._updateMobileConfigVisible(mobileConfigField, value);
            this._updateErrors();
          });
        return toggle;
      });

    let mobileConfigField = new Setting(containerEl)
      .setName('Mobile Config')
      .setDisabled(!this.plugin.settings.mobileSettings.enabled)
      .addTextArea(text => {
        text = text
          .setPlaceholder(example)
          .setValue(JSON.stringify(this.plugin.settings.mobileSettings.types
            ?? this.plugin.settings.types, null, 2))
          .onChange(async (value) => {
            let prev = this.plugin.settings.mobileSettings.configIsValid
              ?? this.plugin.settings.configIsValid;
            let next = {
              ...this.plugin.settings,
              mobileSettings: {
                ...this.plugin.settings.mobileSettings,
              }
            };

            let parsed: Record<string, Array<string>>;
            if (value === "" || value === null || value === undefined) {
              parsed = this.plugin.settings.types;
            } else {
              try {
                parsed = JSON.parse(value);
                next.mobileSettings.configIsValid = true;
                next.mobileSettings.types = parsed;
              } catch {
                next.mobileSettings.configIsValid = false;
              }
            }

            this._updateConfigValidity(text, prev, next.mobileSettings.configIsValid ?? true);
            await this.plugin.updateSettings(next);
            this._updateErrors();
          });
      });

    new Setting(containerEl)
      .setName("Allow Override Of .md Extension")
      .setDesc("If true, the .md extension will be allowed to override the default markdown view type. This is disabled by default to prevent unexpected behavior.")
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.allowMdOverride)
          .onChange(async (value) => {
            let next = {
              ...this.plugin.settings,
              allowMdOverride: value
            };
            await this.plugin.updateSettings(next);
          });
        return toggle;
      });

    this._updateMobileConfigVisible(mobileConfigField, this.plugin.settings.mobileSettings.enabled);

    containerEl.createEl('h3', { text: 'Errors' });
    this._errors = containerEl.createEl('p', { text: "None" });
    this._errors.style.whiteSpace = "pre-line";

    containerEl.createEl('h3', { text: 'Active Extension Associations' });
    containerEl.createEl('p', {
      text: JSON.stringify(
        /**@ts-expect-error */
        this.app.viewRegistry.typeByExtension,
        null, 2
      ).replace(/[\{\}]/g, "")
    }).style.whiteSpace = "pre-line";

    containerEl.createEl('h3', { text: 'Known View Types' });
    containerEl.createEl('p', {
      text:
        JSON.stringify(
          Object.keys(
            /**@ts-expect-error */
            this.app.viewRegistry.viewByType
          ), null, 2
        ).replace(/[\[\]]/g, "")
    }).style.whiteSpace = "pre-line";

    this._updateErrors();
  }

  private _updateMobileConfigVisible(mobileConfigField: Setting, mobileSettingsEnabled: boolean) {
    mobileConfigField.controlEl.style.display = mobileSettingsEnabled ? "block" : "none";
  }

  private _updateConfigValidity(text: TextAreaComponent, prevWasValid: boolean, nextIsValid: boolean) {
    if (prevWasValid !== nextIsValid) {
      if (prevWasValid) {
        if (!this._defaults) {
          this._defaults = {
            color: text.inputEl.style.color,
            borderColor: text.inputEl.style.borderColor,
            borderWidth: text.inputEl.style.borderWidth
          };
        }

        text.inputEl.style.color = "var(--text-error)"; // "red";
        text.inputEl.style.borderColor = "var(--background-modifier-error-rgb)"; // "red";
        text.inputEl.style.borderWidth = "3px";
      } else if (this._defaults) {
        text.inputEl.style.color = this._defaults.color;
        text.inputEl.style.borderColor = this._defaults.borderColor;
        text.inputEl.style.borderWidth = this._defaults.borderWidth;
      }
    }
  }

  private _updateErrors() {
    if (Object.keys(this.plugin.settings.errors).length === 0) {
      this._errors.innerHTML = `None`;
      this._errors.style.color = "green";
    } else {
      this._errors.innerHTML = `Errors: <ul>${Object.keys(this.plugin.settings.errors).map((k) => `<li><b><u>${k}</u></b>: ${this.plugin.settings.errors[k]}</li>`).join("")}</ul>`;
      this._errors.style.color = "var(--text-error)";
    }
  }
}
