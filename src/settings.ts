import { App, Platform, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';
import CustomFileExtensions from './main';

export interface CustomFileExtensionsSettings {
  types: Record<string, Array<string>>;
  configIsValid: boolean;
  allowMdOverride: boolean;
  errors: Record<string, string>;
  mobileSettings: Readonly<{
    enabled: boolean;
    configIsValid: boolean;
    types: Record<string, Array<string>> | undefined;
  }>
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
  private _errors: HTMLParagraphElement;
  private _views: HTMLParagraphElement;
  private _config: Setting;
  private _mobileConfig: Setting;

  constructor(app: App, plugin: CustomFileExtensions) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const example = JSON.stringify(DEFAULT_SETTINGS.types, null, 2);

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Custom File Extensions Settings' });
    this._config = new Setting(containerEl)
      .setName('Config')
      .setDesc("Valid entry is a JSON object who's property keys are view types and values are arrays of the file types to assign to that view.")

    let exampleText = document.createElement('div');
    exampleText.style.fontSize = "80%";
    exampleText.style.margin = "10px";
    exampleText.innerHTML = `<b>Ex</b>: <code>${example}</code>`

    this._config.nameEl.parentElement!.appendChild(exampleText);
    let configTextArea = new TextAreaComponent(containerEl)
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

        this._updateConfigValidity(
          configTextArea,
          this.plugin.settings.configIsValid,
          next.configIsValid
        );

        await this.plugin.updateSettings(next);

        this._updateErrors();
        this._updateList();
        this._updateProfile();
      });
    configTextArea.inputEl.style.width = "100%";
    configTextArea.inputEl.style.height = "150px";
    configTextArea.inputEl.style.minHeight = "100px";

    this._mobileConfig = new Setting(containerEl)
      .setName("Mobile Specific Config")
      .setDesc("If enabled: the config settings below will be used on mobile devices, and the above settings.")
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.settings.mobileSettings.enabled)
          .onChange(async (value) => {
            let next = {
              ...this.plugin.settings,
              mobileSettings: {
                ...this.plugin.settings.mobileSettings,
                enabled: value
              }
            };

            await this.plugin.updateSettings(next);

            this._updateMobileConfigVisible(mobileConfigField, value);

            this._updateErrors();
            this._updateList();
            this._updateProfile();
          });
        return toggle;
      });


    let mobileConfigField = new TextAreaComponent(containerEl)
      .setPlaceholder(example)
      .setValue(this.plugin.settings.mobileSettings.types
        ? JSON.stringify(this.plugin.settings.mobileSettings.types, null, 2)
        : "")
      .onChange(async (value) => {
        let next = {
          ...this.plugin.settings,
          mobileSettings: {
            ...this.plugin.settings.mobileSettings,
            types: undefined as Record<string, Array<string>> | undefined
          }
        };


        if (value !== "" && value !== null && value !== undefined) {
          try {
            let parsed: Record<string, Array<string>> = JSON.parse(value);
            next.mobileSettings.configIsValid = true;
            next.mobileSettings.types = parsed;
          } catch {
            next.mobileSettings.configIsValid = false;
          }
        }

        this._updateConfigValidity(
          mobileConfigField,
          this.plugin.settings.mobileSettings.configIsValid,
          next.mobileSettings.configIsValid
        );

        await this.plugin.updateSettings(next);

        this._updateErrors();
        this._updateList();
        this._updateProfile();
      });
    mobileConfigField.inputEl.style.width = "100%";
    mobileConfigField.inputEl.style.height = "150px";
    mobileConfigField.inputEl.style.minHeight = "100px";
    this._updateMobileConfigVisible(mobileConfigField, this.plugin.settings.mobileSettings.enabled);

    new Setting(containerEl)
      .setName("Allow Override Of .md Extension")
      .setDesc("If enabled: the .md extension will be allowed to override the default markdown view type. This is disabled by default to prevent unexpected behavior.")
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


    containerEl.createEl('h3', { text: 'Errors' });
    this._errors = containerEl.createEl('p', { text: "None" });
    this._errors.style.whiteSpace = "pre-line";

    containerEl.createEl('h3', { text: 'Active View Types and Extensions' });
    this._views = containerEl.createEl('p')
    this._views.style.whiteSpace = "pre-line";

    this._updateErrors();
    this._updateList();
    this._updateProfile();
  }

  private _updateMobileConfigVisible(mobileConfigField: TextAreaComponent, mobileSettingsEnabled: boolean) {
    mobileConfigField.inputEl.style.display
      = mobileSettingsEnabled
        ? "block"
        : "none";
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
      this._errors.innerHTML = `Errors: <ul>${Object.keys(this.plugin.settings.errors)
        .map((k) => `<li><b>${k}</b>: ${this.plugin.settings.errors[k]}</li>`)
        .join("")}</ul>`;
      this._errors.style.color = "var(--text-error)";
    }
  }

  private _updateProfile() {
    if (this.plugin.useMobile) {
      this._mobileConfig.nameEl.innerHTML = `Mobile Specific Config&nbsp;<sup style="color: green">(active)</sup>`
      this._config.nameEl.innerHTML = `Config&nbsp;<sup style="color: gray">(inactive)</sup>`
    } else {
      this._config.nameEl.innerHTML = `Config&nbsp;<sup style="color: green">(active)</sup>`;
      this._mobileConfig.nameEl.innerHTML = `Mobile Specific Config&nbsp;<sup style="color: gray">(inactive)</sup>`
    }
  }

  private _updateList() {
    this._views.innerHTML
      = `<ul>${Object.keys(
        /**@ts-expect-error */
        this.app.viewRegistry.viewByType
      ).sort(
        (a, b) => {
          let extCountForViewKeyA = this._getExtensionsForView(a).length;
          let extCountForViewKeyB = this._getExtensionsForView(b).length;

          return extCountForViewKeyB - extCountForViewKeyA;
        }
      ).map(viewType => {
        const extensions = this._getExtensionsForView(viewType);

        return `<li>${extensions.length > 0
          ? `<b ${_copy()}>${viewType}</b>`
          : `<span ${_copy()} style="color: gray">${viewType}</span>`
          }${extensions.length
            ? `: ${extensions
              .sort(
                (a, b) => b.length - a.length
              ).map(
                ext => ext
                  ? `<code ${_copy()}>${ext}</code>`
                  : `<code>""</code> <span style="color: gray"><i>(extensionless)</i></span>`
              ).join(", ")}`
            : ``}</li>`
      }).join("")}</ul>`

    function _copy() {
      return `
      onmouseover="this.style.textDecoration='underline';" 
      onmouseout="this.style.textDecoration='none';"
      title="Click to copy"
      onclick="
        navigator.clipboard.writeText(this.innerText);
        new Notification('Custom File Extensions Plugin', {body:'Copied: \\\'' + this.innerText + '\\\', to clipboard.'});
      "`
    }
  }

  _getExtensionsForView(view: string) {
    return Object.entries(
      /**@ts-expect-error */
      this.app.viewRegistry.typeByExtension
    ).filter(
      ([, v]: [string, string]) => v === view
    ).map(
      ([ext, _]: [string, string]) => ext
    );
  }
}
