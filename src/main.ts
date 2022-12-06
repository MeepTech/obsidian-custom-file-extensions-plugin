import { App, Plugin, PluginSettingTab, Setting, TextAreaComponent } from 'obsidian';

interface CustomFileExtensionsSettings {
  additionalFileTypes: Record<string, Array<string>>;
  currentValueIsInvalidJson: boolean;
}

const DEFAULT_SETTINGS: CustomFileExtensionsSettings = {
  additionalFileTypes: {
    "markdown": [
      "", "txt", "html",
      "js", "css", "ts",
      "jsx", "tsx", "yaml",
      "yml", "sass", "scss"
    ]
  },
  currentValueIsInvalidJson: false
}

export default class CustomFileExtensions extends Plugin {
  private _settings: CustomFileExtensionsSettings;
  public get settings(): CustomFileExtensionsSettings {
    return this._settings;
  }

  async onload() {
    super.onload();
    await this.loadSettings();
    this.addSettingTab(new CustomFileExtensionsSettingTab(this.app, this));
    this._apply(this.settings.additionalFileTypes);
  }

  onunload() {
    this._unapply(this._settings.additionalFileTypes);

    // reset the defaults:
    try {
      this.registerExtensions([".md"], 'markdown');
    } catch { }
  }

  async loadSettings() {
    this._settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async updateSettings(newSettings: CustomFileExtensionsSettings) {
    this._unapply(this._settings.additionalFileTypes);
    this._settings = newSettings;

    await this.saveData(this.settings);
    this._apply(this.settings.additionalFileTypes);
  }

  private _apply(extensionsByViewType: Record<string, Array<string>>) {
    for (const view in extensionsByViewType) {
      for (const fileType of this.settings.additionalFileTypes[view]) {
        this.registerExtensions([fileType], view);
      }
    }
  }

  private _unapply(extensionsByViewType: Record<string, Array<string>>) {
    for (const view of Object.values(extensionsByViewType).flat()) {
      try {
        /**@ts-expect-error */
        this.app.viewRegistry.unregisterExtensions([view]);
      } catch {
        console.log("ERROR");
      }
    }
  }
}

class CustomFileExtensionsSettingTab extends PluginSettingTab {
  plugin: CustomFileExtensions;
  private _defaults?: {
    color: string;
    borderColor: string;
    borderWidth: string;
  } = undefined;

  constructor(app: App, plugin: CustomFileExtensions) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Custom File Extensions Settings' });

    const settings = new Setting(containerEl)
      .setName('Config')
      .setDesc("Valid entry is a JSON object with properties named after the desired view, containing the file types to assign to that view. EX: " + DEFAULT_SETTINGS.additionalFileTypes)
      .addTextArea(text => {
        text = text
          .setPlaceholder(JSON.stringify(DEFAULT_SETTINGS.additionalFileTypes))
          .setValue(JSON.stringify(this.plugin.settings.additionalFileTypes))
          .onChange(async (value) => {
            let parsed: any = null;
            try {
              parsed = JSON.parse(value);
              this.updateErrorState(text, false);
            } catch {
              this.updateErrorState(text, true);
              return;
            }

            this.plugin.settings.additionalFileTypes = parsed;
            await this.plugin.updateSettings(this.plugin.settings);
          });
        
        return text;
      });
  }

  updateErrorState(text: TextAreaComponent, to: boolean) {
    if (this.plugin.settings.currentValueIsInvalidJson !== to) {
      this.plugin.settings.currentValueIsInvalidJson = to;

      if (this.plugin.settings.currentValueIsInvalidJson) {
        if (!this._defaults) {
          this._defaults = {
            color: text.inputEl.style.color,
            borderColor: text.inputEl.style.borderColor,
            borderWidth: text.inputEl.style.borderWidth
          }
        }

        text.inputEl.style.color = "var(--text-error)"// "red";
        text.inputEl.style.borderColor = "var(--background-modifier-error-rgb)" // "red";
        text.inputEl.style.borderWidth = "3px";
      } else if (this._defaults) {
        text.inputEl.style.color = this._defaults.color;
        text.inputEl.style.borderColor = this._defaults.borderColor;
        text.inputEl.style.borderWidth = this._defaults.borderWidth;
      }
    }
  }
}
